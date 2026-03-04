use axum::{extract::State, Json, http::StatusCode};
use serde::{Deserialize, Serialize};
use bcrypt::verify;
use jsonwebtoken::{encode, Header, EncodingKey};
use std::env;
use chrono::{Utc, Duration};

#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password_raw: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserInfo,
}

#[derive(Serialize)]
pub struct UserInfo {
    pub id: String,
    pub username: String,
    pub role: String,
}

#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String,     // User ID
    role: String,
    exp: usize,    // Expiration time (as UTC timestamp)
}

#[derive(sqlx::FromRow)]
struct UserRow {
    id: String,
    username: String,
    password_hash: String,
    role: String,
}

#[derive(sqlx::FromRow, Serialize)]
pub struct UserDetail {
    pub id: String,
    pub username: String,
    pub role: String,
    pub created_at: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateRoleRequest {
    pub role: String,
}

/// POST /api/login
pub async fn login(
    State(state): State<crate::AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, (StatusCode, Json<ErrorResponse>)> {
    
    // 1. Fetch user by username
    let user = sqlx::query_as::<_, UserRow>(
        r#"
        SELECT id, username, password_hash, role
        FROM users
        WHERE username = $1
        "#
    )
    .bind(&payload.username)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    let user = match user {
        Some(u) => u,
        None => return Err((
            StatusCode::UNAUTHORIZED, 
            Json(ErrorResponse { error: "Invalid username or password".to_string() })
        )),
    };

    // 2. Verify password with bcrypt
    let valid = verify(&payload.password_raw, &user.password_hash).unwrap_or(false);
    
    if !valid {
        return Err((
            StatusCode::UNAUTHORIZED, 
            Json(ErrorResponse { error: "Invalid username or password".to_string() })
        ));
    }

    // 3. Generate JWT Token
    let expr = Utc::now()
        .checked_add_signed(Duration::days(1))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: user.id.clone(),
        role: user.role.clone(),
        exp: expr,
    };

    let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "super_secret_dev_key_only_vinyl_store".to_string());
    
    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret.as_bytes())
    ).map_err(|_| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: "Failed to generate token".to_string() }))
    })?;

    Ok(Json(LoginResponse {
        token,
        user: UserInfo {
            id: user.id,
            username: user.username,
            role: user.role,
        }
    }))
}

#[derive(Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub password_raw: String,
}

#[derive(Serialize)]
pub struct RegisterResponse {
    pub message: String,
}

/// POST /api/register
pub async fn register(
    State(state): State<crate::AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<(StatusCode, Json<RegisterResponse>), (StatusCode, Json<ErrorResponse>)> {
    
    // Hash the password
    let password_hash = match bcrypt::hash(&payload.password_raw, 12) {
        Ok(h) => h,
        Err(e) => return Err((
            StatusCode::INTERNAL_SERVER_ERROR, 
            Json(ErrorResponse { error: format!("Failed to hash password: {}", e) })
        )),
    };

    let user_id = uuid::Uuid::new_v4().to_string();
    let role = "customer";

    // Insert new user
    let res = sqlx::query(
        r#"
        INSERT INTO users (id, username, password_hash, role)
        VALUES ($1, $2, $3, $4)
        "#
    )
    .bind(&user_id)
    .bind(&payload.username)
    .bind(&password_hash)
    .bind(role)
    .execute(&state.db)
    .await;

    match res {
        Ok(_) => Ok((
            StatusCode::CREATED,
            Json(RegisterResponse { message: "User registered successfully".into() })
        )),
        Err(sqlx::Error::Database(db_err)) if db_err.is_unique_violation() => {
             Err((
                StatusCode::CONFLICT, 
                Json(ErrorResponse { error: "Username already exists".into() })
            ))
        },
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR, 
            Json(ErrorResponse { error: format!("Database error: {}", e) })
        )),
    }
}

/// GET /api/admin/users
/// Admin only
pub async fn list_users(
    State(state): State<crate::AppState>,
    axum::extract::Extension(claims): axum::extract::Extension<crate::handlers::middleware::Claims>,
) -> Result<Json<Vec<UserDetail>>, (StatusCode, Json<ErrorResponse>)> {
    if claims.role != "admin" {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse { error: "Requires administrator privileges".into() })));
    }

    let users = sqlx::query_as::<_, UserDetail>(
        r#"
        SELECT id, username, role, created_at
        FROM users
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    Ok(Json(users))
}

/// PATCH /api/admin/users/:id/role
/// Admin only
pub async fn update_user_role(
    State(state): State<crate::AppState>,
    axum::extract::Extension(claims): axum::extract::Extension<crate::handlers::middleware::Claims>,
    axum::extract::Path(id): axum::extract::Path<String>,
    Json(payload): Json<UpdateRoleRequest>,
) -> Result<Json<UserDetail>, (StatusCode, Json<ErrorResponse>)> {
    if claims.role != "admin" {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse { error: "Requires administrator privileges".into() })));
    }

    // Update role
    let user = sqlx::query_as::<_, UserDetail>(
        r#"
        UPDATE users
        SET role = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, username, role, created_at
        "#
    )
    .bind(payload.role)
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    Ok(Json(user))
}

use axum::{extract::State, Json, http::StatusCode};
use serde::{Deserialize, Serialize};

use crate::handlers::middleware::Claims;

#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(sqlx::FromRow, Serialize)]
pub struct UserProfile {
    pub id: String,
    pub username: String,
    pub role: String,
    pub full_name: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateProfileRequest {
    pub full_name: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
}

/// GET /api/user/profile
pub async fn get_profile(
    State(state): State<crate::AppState>,
    axum::extract::Extension(claims): axum::extract::Extension<Claims>,
) -> Result<Json<UserProfile>, (StatusCode, Json<ErrorResponse>)> {
    let user = sqlx::query_as::<_, UserProfile>(
        r#"
        SELECT id, username, role, full_name, phone, address
        FROM users
        WHERE id = $1
        "#,
    )
    .bind(&claims.sub)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    match user {
        Some(u) => Ok(Json(u)),
        None => Err((StatusCode::NOT_FOUND, Json(ErrorResponse { error: "User not found".into() }))),
    }
}

/// PUT /api/user/profile
pub async fn update_profile(
    State(state): State<crate::AppState>,
    axum::extract::Extension(claims): axum::extract::Extension<Claims>,
    Json(payload): Json<UpdateProfileRequest>,
) -> Result<Json<UserProfile>, (StatusCode, Json<ErrorResponse>)> {
    sqlx::query(
        r#"
        UPDATE users
        SET
            full_name = COALESCE($1, full_name),
            phone = COALESCE($2, phone),
            address = COALESCE($3, address),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        "#,
    )
    .bind(&payload.full_name)
    .bind(&payload.phone)
    .bind(&payload.address)
    .bind(&claims.sub)
    .execute(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    // Return the updated profile
    get_profile(
        State(state),
        axum::extract::Extension(claims),
    ).await
}

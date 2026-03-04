use axum::{extract::State, extract::Multipart, Json, http::StatusCode};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(sqlx::FromRow, Serialize, Deserialize, Clone)]
pub struct ShowcaseItem {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub image_url: String,
    pub category: Option<String>,
    pub example_price: Option<f64>,
    pub is_visible: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Deserialize)]
pub struct CreateShowcaseRequest {
    pub title: String,
    pub description: Option<String>,
    pub image_url: String,
    pub category: Option<String>,
    pub example_price: Option<f64>,
}

#[derive(Deserialize)]
pub struct UpdateShowcaseRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub category: Option<String>,
    pub example_price: Option<f64>,
    pub is_visible: Option<bool>,
}

/// GET /api/showcase
/// Public API to list only visible showcase items
pub async fn list_showcase(
    State(state): State<crate::AppState>,
) -> Result<Json<Vec<ShowcaseItem>>, (StatusCode, Json<ErrorResponse>)> {
    let items = sqlx::query_as::<_, ShowcaseItem>(
        r#"
        SELECT id, title, description, image_url, category, example_price, is_visible, created_at, updated_at
        FROM showcase
        WHERE is_visible = 1
        ORDER BY created_at DESC
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    Ok(Json(items))
}

/// GET /api/admin/showcase
/// Admin API to list all showcase items
pub async fn admin_list_showcase(
    State(state): State<crate::AppState>,
) -> Result<Json<Vec<ShowcaseItem>>, (StatusCode, Json<ErrorResponse>)> {
    let items = sqlx::query_as::<_, ShowcaseItem>(
        r#"
        SELECT id, title, description, image_url, category, example_price, is_visible, created_at, updated_at
        FROM showcase
        ORDER BY created_at DESC
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    Ok(Json(items))
}

/// POST /api/admin/showcase
pub async fn create_showcase_item(
    State(state): State<crate::AppState>,
    Json(payload): Json<CreateShowcaseRequest>,
) -> Result<(StatusCode, Json<ShowcaseItem>), (StatusCode, Json<ErrorResponse>)> {
    let id = Uuid::new_v4().to_string();

    let item = sqlx::query_as::<_, ShowcaseItem>(
        r#"
        INSERT INTO showcase (id, title, description, image_url, category, example_price)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, title, description, image_url, category, example_price, is_visible, created_at, updated_at
        "#,
    )
    .bind(&id)
    .bind(&payload.title)
    .bind(&payload.description)
    .bind(&payload.image_url)
    .bind(&payload.category)
    .bind(payload.example_price)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    Ok((StatusCode::CREATED, Json(item)))
}

/// PATCH /api/admin/showcase/:id
pub async fn update_showcase_item(
    State(state): State<crate::AppState>,
    axum::extract::Path(id): axum::extract::Path<String>,
    Json(payload): Json<UpdateShowcaseRequest>,
) -> Result<Json<ShowcaseItem>, (StatusCode, Json<ErrorResponse>)> {
    let _res = sqlx::query(
        r#"
        UPDATE showcase
        SET 
            title = COALESCE($1, title),
            description = COALESCE($2, description),
            image_url = COALESCE($3, image_url),
            category = COALESCE($4, category),
            example_price = COALESCE($5, example_price),
            is_visible = COALESCE($6, is_visible),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        "#,
    )
    .bind(&payload.title)
    .bind(&payload.description)
    .bind(&payload.image_url)
    .bind(&payload.category)
    .bind(payload.example_price)
    .bind(payload.is_visible)
    .bind(&id)
    .execute(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    if _res.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, Json(ErrorResponse { error: "Item not found".into() })));
    }

    let item = sqlx::query_as::<_, ShowcaseItem>(
        r#"
        SELECT id, title, description, image_url, category, example_price, is_visible, created_at, updated_at
        FROM showcase
        WHERE id = $1
        "#,
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    Ok(Json(item))
}

/// DELETE /api/admin/showcase/:id
pub async fn delete_showcase_item(
    State(state): State<crate::AppState>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    let res = sqlx::query("DELETE FROM showcase WHERE id = $1")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
        })?;

    if res.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, Json(ErrorResponse { error: "Item not found".into() })));
    }

    Ok(StatusCode::NO_CONTENT)
}

#[derive(Serialize)]
pub struct UploadResponse {
    pub url: String,
}

/// POST /api/admin/showcase/upload
pub async fn upload_showcase_image(
    mut multipart: Multipart,
) -> Result<Json<UploadResponse>, (StatusCode, Json<ErrorResponse>)> {
    let mut image_url = None;

    while let Some(field) = multipart.next_field().await.unwrap_or(None) {
        let name = field.name().unwrap_or("").to_string();
        if name == "file" {
            let file_name = field.file_name().unwrap_or("unknown.jpg").to_string();
            let ext = std::path::Path::new(&file_name)
                .extension()
                .and_then(std::ffi::OsStr::to_str)
                .unwrap_or("jpg");
            let new_filename = format!("showcase_{}.{}", Uuid::new_v4(), ext);
            let path = format!("uploads/{}", new_filename);
            
            let data = field.bytes().await.map_err(|e| {
                (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
            })?;
            
            use tokio::io::AsyncWriteExt;
            let mut file = tokio::fs::File::create(&path).await.map_err(|e| {
                 (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
            })?;
            file.write_all(&data).await.map_err(|e| {
                 (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
            })?;
            
            image_url = Some(format!("http://localhost:3001/uploads/{}", new_filename));
            break;
        }
    }

    let Some(url) = image_url else {
        return Err((StatusCode::BAD_REQUEST, Json(ErrorResponse { error: "No file uploaded".into() })));
    };

    Ok(Json(UploadResponse { url }))
}

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use super::middleware::Claims;

#[derive(Serialize, FromRow)]
pub struct InventoryRow {
    pub id: String,
    pub material_type: String,
    pub base_price_per_sqm: f64,
    pub stock_quantity: f64,
    pub is_active: bool,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateInventoryRequest {
    pub material_type: String,
    pub base_price_per_sqm: f64,
    pub stock_quantity: f64,
    pub is_active: bool,
}

#[derive(Deserialize)]
pub struct UpdateInventoryRequest {
    pub material_type: Option<String>,
    pub base_price_per_sqm: Option<f64>,
    pub stock_quantity: Option<f64>,
    pub is_active: Option<bool>,
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

/// GET /api/inventory
/// Public route (or customer) to fetch available materials
pub async fn list_inventory(
    State(state): State<crate::AppState>,
) -> Result<Json<Vec<InventoryRow>>, (StatusCode, Json<ErrorResponse>)> {
    let inventory = sqlx::query_as::<_, InventoryRow>(
        r#"
        SELECT id, material_type, base_price_per_sqm, stock_quantity, is_active, created_at, updated_at
        FROM inventory
        WHERE is_active = true
        ORDER BY material_type ASC
        "#
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    Ok(Json(inventory))
}

/// GET /api/admin/inventory
/// Admin route to view all materials including inactive ones
pub async fn list_all_inventory(
    State(state): State<crate::AppState>,
    axum::extract::Extension(claims): axum::extract::Extension<Claims>,
) -> Result<Json<Vec<InventoryRow>>, (StatusCode, Json<ErrorResponse>)> {
    if claims.role != "admin" && claims.role != "staff" {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse { error: "Requires admin role".into() })));
    }

    let inventory = sqlx::query_as::<_, InventoryRow>(
        r#"
        SELECT id, material_type, base_price_per_sqm, stock_quantity, is_active, created_at, updated_at
        FROM inventory
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    Ok(Json(inventory))
}

/// POST /api/inventory
/// Admin only
pub async fn create_inventory(
    State(state): State<crate::AppState>,
    axum::extract::Extension(claims): axum::extract::Extension<Claims>,
    Json(payload): Json<CreateInventoryRequest>,
) -> Result<(StatusCode, Json<InventoryRow>), (StatusCode, Json<ErrorResponse>)> {
    if claims.role != "admin" && claims.role != "staff" {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse { error: "Requires admin role".into() })));
    }

    let raw_id = Uuid::new_v4().to_string();

    let row = sqlx::query_as::<_, InventoryRow>(
        r#"
        INSERT INTO inventory (id, material_type, base_price_per_sqm, stock_quantity, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, material_type, base_price_per_sqm, stock_quantity, is_active, created_at, updated_at
        "#
    )
    .bind(&raw_id)
    .bind(payload.material_type)
    .bind(payload.base_price_per_sqm)
    .bind(payload.stock_quantity)
    .bind(payload.is_active)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    Ok((StatusCode::CREATED, Json(row)))
}

/// PATCH /api/inventory/:id
/// Admin only
pub async fn update_inventory(
    State(state): State<crate::AppState>,
    axum::extract::Extension(claims): axum::extract::Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateInventoryRequest>,
) -> Result<Json<InventoryRow>, (StatusCode, Json<ErrorResponse>)> {
    if claims.role != "admin" && claims.role != "staff" {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse { error: "Requires admin role".into() })));
    }

    // Coalesce updates logic
    let row = sqlx::query_as::<_, InventoryRow>(
        r#"
        UPDATE inventory
        SET
            material_type = COALESCE($1, material_type),
            base_price_per_sqm = COALESCE($2, base_price_per_sqm),
            stock_quantity = COALESCE($3, stock_quantity),
            is_active = COALESCE($4, is_active),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING id, material_type, base_price_per_sqm, stock_quantity, is_active, created_at, updated_at
        "#
    )
    .bind(payload.material_type)
    .bind(payload.base_price_per_sqm)
    .bind(payload.stock_quantity)
    .bind(payload.is_active)
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    Ok(Json(row))
}

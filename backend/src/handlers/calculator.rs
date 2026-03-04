use axum::{extract::State, Json, http::StatusCode};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CalculatorRequest {
    pub width_m: f64,
    pub height_m: f64,
    pub material_id: Uuid,
}

#[derive(Serialize)]
pub struct CalculatorResponse {
    pub total_sqm: f64,
    pub estimated_price: f64,
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(sqlx::FromRow)]
struct MaterialRow {
    base_price: f64,
}

/// POST /api/calculator
pub async fn calculate_price(
    State(state): State<crate::AppState>,
    Json(payload): Json<CalculatorRequest>,
) -> Result<Json<CalculatorResponse>, (StatusCode, Json<ErrorResponse>)> {
    let total_sqm = payload.width_m * payload.height_m;

    // Cast DECIMAL to FLOAT8 (f64 representation in rust) to avoid requiring rust_decimal crate for now
    let material = sqlx::query_as::<_, MaterialRow>(
        r#"
        SELECT base_price_per_sqm as base_price
        FROM inventory
        WHERE id = $1 AND is_active = true
        "#,
    )
    .bind(payload.material_id.to_string())
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Database error: {}", e),
            }),
        )
    })?;

    match material {
        Some(mat) => {
            let estimated_price = total_sqm * mat.base_price;
            Ok(Json(CalculatorResponse {
                total_sqm,
                estimated_price,
            }))
        }
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "Material not found or inactive".to_string(),
            }),
        )),
    }
}

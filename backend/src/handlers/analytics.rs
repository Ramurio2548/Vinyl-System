use axum::{extract::State, Json, http::StatusCode};
use serde::Serialize;
use crate::handlers::middleware::Claims;

#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct SalesSummary {
    pub total_revenue: f64,
    pub total_orders: i64,
    pub avg_order_value: f64,
    pub total_customers: i64,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct MaterialStats {
    pub material_name: String,
    pub order_count: i64,
    pub revenue: f64,
}

#[derive(Serialize)]
pub struct AnalyticsResponse {
    pub summary: SalesSummary,
    pub top_materials: Vec<MaterialStats>,
}

/// GET /api/admin/analytics/summary
/// Admin only
pub async fn get_analytics_summary(
    State(state): State<crate::AppState>,
    axum::extract::Extension(claims): axum::extract::Extension<Claims>,
) -> Result<Json<AnalyticsResponse>, (StatusCode, Json<ErrorResponse>)> {
    
    // 1. Verify admin role
    if claims.role != "admin" && claims.role != "staff" {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse { error: "Admin access required".into() })));
    }

    // 2. Fetch Summary Statistics
    // We treat estimated_price as the actual price for this calculation
    let summary = sqlx::query_as::<_, SalesSummary>(
        r#"
        SELECT 
            COALESCE(SUM(estimated_price), 0) as total_revenue,
            COUNT(*) as total_orders,
            COALESCE(AVG(estimated_price), 0) as avg_order_value,
            COUNT(DISTINCT customer_id) as total_customers
        FROM orders
        "#
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    // 3. Fetch Top Materials
    let top_materials = sqlx::query_as::<_, MaterialStats>(
        r#"
        SELECT 
            i.material_type as material_name,
            COUNT(o.id) as order_count,
            SUM(o.estimated_price) as revenue
        FROM orders o
        JOIN inventory i ON o.material_id = i.id
        GROUP BY i.material_type
        ORDER BY revenue DESC
        LIMIT 5
        "#
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    Ok(Json(AnalyticsResponse {
        summary,
        top_materials,
    }))
}

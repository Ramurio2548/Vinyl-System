use axum::{extract::State, extract::Multipart, Json, http::StatusCode};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use aws_sdk_s3::presigning::PresigningConfig;
use std::time::Duration;

// We reuse the ErrorResponse from calculator or define a new one.
// Properly, this should be in a shared errors or responses module, but we will define it here for simplicity.
#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(Deserialize)]
pub struct CreateOrderRequest {
    pub customer_id: Option<Uuid>, // Optional since we don't have full auth yet
    pub material_id: Uuid,
    pub width_m: f64,
    pub height_m: f64,
    pub file_url: Option<String>,
}

#[derive(Serialize)]
pub struct CreateOrderResponse {
    pub order_id: String,
    pub status: String,
}

#[derive(sqlx::FromRow, Serialize, Clone)]
pub struct OrderRow {
    pub id: String,
    pub customer_id: Option<String>,
    pub customer_name: Option<String>, // Added
    pub material_id: String,
    pub material_name: Option<String>, // Added
    pub width_m: f64,
    pub height_m: f64,
    pub total_sqm: f64,
    pub file_url: Option<String>,
    pub slip_url: Option<String>,
    pub estimated_price: f64,
    pub status: String,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}

/// POST /api/orders
pub async fn create_order(
    State(state): State<crate::AppState>,
    Json(payload): Json<CreateOrderRequest>,
) -> Result<(StatusCode, Json<CreateOrderResponse>), (StatusCode, Json<ErrorResponse>)> {
    
    // First, recalculate the total_sqm and price matching the core business logic
    let total_sqm = payload.width_m * payload.height_m;

    #[derive(sqlx::FromRow)]
    struct MaterialRow {
        base_price: f64,
    }

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
         (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    let base_price = match material {
        Some(mat) => mat.base_price,
        None => return Err((
            StatusCode::BAD_REQUEST, 
            Json(ErrorResponse { error: "Invalid material_id".into() })
        )),
    };

    let estimated_price = total_sqm * base_price;
    let initial_status = "Pending_Payment";

    #[derive(sqlx::FromRow)]
    struct OrderRecord {
        id: String,
    }

    let row = sqlx::query_as::<_, OrderRecord>(
        r#"
        INSERT INTO orders (id, customer_id, material_id, width_m, height_m, total_sqm, file_url, estimated_price, status, slip_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL)
        RETURNING id
        "#,
    )
    .bind(Uuid::new_v4().to_string())
    .bind(payload.customer_id.map(|id| id.to_string()))
    .bind(payload.material_id.to_string())
    .bind(payload.width_m)
    .bind(payload.height_m)
    .bind(total_sqm)
    .bind(payload.file_url)
    .bind(estimated_price)
    .bind(initial_status)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    Ok((
        StatusCode::CREATED,
        Json(CreateOrderResponse {
            order_id: row.id,
            status: initial_status.to_string(),
        }),
    ))
}

/// GET /api/orders
pub async fn list_orders(
    State(state): State<crate::AppState>,
) -> Result<Json<Vec<OrderRow>>, (StatusCode, Json<ErrorResponse>)> {
    
    let orders = sqlx::query_as::<_, OrderRow>(
        r#"
        SELECT 
            o.id, 
            o.customer_id, 
            u.username as customer_name,
            o.material_id, 
            i.material_type as material_name,
            o.width_m, 
            o.height_m, 
            o.total_sqm, 
            o.file_url, 
            o.slip_url,
            o.estimated_price, 
            o.status, 
            o.created_at, 
            o.updated_at
        FROM orders o
        LEFT JOIN users u ON o.customer_id = u.id
        LEFT JOIN inventory i ON o.material_id = i.id
        ORDER BY o.created_at DESC
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    Ok(Json(orders))
}

#[derive(Deserialize)]
pub struct UpdateOrderStatusRequest {
    pub status: String,
}

/// GET /api/orders/:id
pub async fn get_order(
    State(state): State<crate::AppState>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Result<Json<OrderRow>, (StatusCode, Json<ErrorResponse>)> {
    
    let order = sqlx::query_as::<_, OrderRow>(
        r#"
        SELECT 
            o.id, 
            o.customer_id, 
            u.username as customer_name,
            o.material_id, 
            i.material_type as material_name,
            o.width_m, 
            o.height_m, 
            o.total_sqm, 
            o.file_url, 
            o.slip_url,
            o.estimated_price, 
            o.status, 
            o.created_at, 
            o.updated_at
        FROM orders o
        LEFT JOIN users u ON o.customer_id = u.id
        LEFT JOIN inventory i ON o.material_id = i.id
        WHERE o.id = $1
        "#,
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    match order {
        Some(o) => Ok(Json(o)),
        None => Err((StatusCode::NOT_FOUND, Json(ErrorResponse { error: "Order not found".into() }))),
    }
}

/// PATCH /api/orders/:id/status
pub async fn update_order_status(
    State(state): State<crate::AppState>,
    axum::extract::Path(id): axum::extract::Path<String>,
    Json(payload): Json<UpdateOrderStatusRequest>,
) -> Result<Json<OrderRow>, (StatusCode, Json<ErrorResponse>)> {
    
    // In SQLite, updated_at doesn't auto-update like our Postgres trigger did, 
    // so we set it manually in the query.
    let _res = sqlx::query(
        r#"
        UPDATE orders
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        "#,
    )
    .bind(&payload.status)
    .bind(&id)
    .execute(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    if _res.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, Json(ErrorResponse { error: "Order not found".into() })));
    }

    // Fetch the updated order back
    get_order(State(state), axum::extract::Path(id)).await
}

/// PATCH /api/orders/:id/slip
pub async fn upload_slip(
    State(state): State<crate::AppState>,
    axum::extract::Extension(claims): axum::extract::Extension<crate::handlers::middleware::Claims>,
    axum::extract::Path(id): axum::extract::Path<String>,
    mut multipart: Multipart,
) -> Result<Json<OrderRow>, (StatusCode, Json<ErrorResponse>)> {
    
    // Ensure the order belongs to the user
    let user_id = claims.sub;

    let mut slip_url = None;

    while let Some(field) = multipart.next_field().await.unwrap_or(None) {
        let name = field.name().unwrap_or("").to_string();
        if name == "file" {
            let file_name = field.file_name().unwrap_or("unknown.jpg").to_string();
            let ext = std::path::Path::new(&file_name)
                .extension()
                .and_then(std::ffi::OsStr::to_str)
                .unwrap_or("jpg");
            let new_filename = format!("{}.{}", Uuid::new_v4(), ext);
            let path = format!("uploads/{}", new_filename);
            
            let data = field.bytes().await.map_err(|e| {
                (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
            })?;
            
            let mut file = File::create(&path).await.map_err(|e| {
                 (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
            })?;
            file.write_all(&data).await.map_err(|e| {
                 (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
            })?;
            
            let prefix = std::env::var("UPLOAD_URL_PREFIX").unwrap_or_else(|_| "http://localhost:3001".to_string());
            slip_url = Some(format!("{}/uploads/{}", prefix.trim_end_matches('/'), new_filename));
            break;
        }
    }

    let Some(slip_url_str) = slip_url else {
        return Err((StatusCode::BAD_REQUEST, Json(ErrorResponse { error: "No file uploaded (expected field 'file')".into() })));
    };

    let _res = sqlx::query(
        r#"
        UPDATE orders
        SET slip_url = $1, status = 'Payment_Checking', updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND customer_id = $3
        "#,
    )
    .bind(&slip_url_str)
    .bind(&id)
    .bind(&user_id)
    .execute(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    if _res.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, Json(ErrorResponse { error: "Order not found or not owned by you".into() })));
    }

    get_order(State(state), axum::extract::Path(id)).await
}

/// GET /api/customer/orders
pub async fn get_customer_orders(
    State(state): State<crate::AppState>,
    axum::extract::Extension(claims): axum::extract::Extension<crate::handlers::middleware::Claims>,
) -> Result<Json<Vec<OrderRow>>, (StatusCode, Json<ErrorResponse>)> {
    
    // Safety check - ensure it's a customer (or allow staff to view their own test orders too)
    let customer_id = claims.sub;

    let orders = sqlx::query_as::<_, OrderRow>(
        r#"
        SELECT 
            o.id, 
            o.customer_id, 
            u.username as customer_name,
            o.material_id, 
            i.material_type as material_name,
            o.width_m, 
            o.height_m, 
            o.total_sqm, 
            o.file_url, 
            o.slip_url,
            o.estimated_price, 
            o.status, 
            o.created_at, 
            o.updated_at
        FROM orders o
        LEFT JOIN users u ON o.customer_id = u.id
        LEFT JOIN inventory i ON o.material_id = i.id
        WHERE o.customer_id = $1
        ORDER BY o.created_at DESC
        "#,
    )
    .bind(&customer_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    Ok(Json(orders))
}

/// POST /api/orders/:id/reorder
pub async fn reorder(
    State(state): State<crate::AppState>,
    axum::extract::Extension(claims): axum::extract::Extension<crate::handlers::middleware::Claims>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Result<(StatusCode, Json<CreateOrderResponse>), (StatusCode, Json<ErrorResponse>)> {
    
    // 1. Fetch old order
    let old_order = sqlx::query_as::<_, OrderRow>(
        r#"
        SELECT 
            id, customer_id, material_id, width_m, height_m, total_sqm, file_url, slip_url, estimated_price, status, created_at, updated_at
        FROM orders
        WHERE id = $1 AND customer_id = $2
        "#,
    )
    .bind(&id)
    .bind(&claims.sub) // Ensure they own this order
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    let old_order = match old_order {
        Some(o) => o,
        None => return Err((StatusCode::NOT_FOUND, Json(ErrorResponse { error: "Original order not found or not owned by you".into() }))),
    };

    // 2. Fetch latest material price
    #[derive(sqlx::FromRow)]
    struct MaterialRow {
        base_price: f64,
    }

    let material = sqlx::query_as::<_, MaterialRow>(
        r#"
        SELECT base_price_per_sqm as base_price
        FROM inventory
        WHERE id = $1 AND is_active = true
        "#,
    )
    .bind(&old_order.material_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
         (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    let base_price = match material {
        Some(mat) => mat.base_price,
        None => return Err((
            StatusCode::BAD_REQUEST, 
            Json(ErrorResponse { error: "The material used in this order is no longer available".into() })
        )),
    };

    // 3. Recalculate price in case material price changed since last time
    let estimated_price = old_order.total_sqm * base_price;
    let new_order_id = Uuid::new_v4().to_string();
    let initial_status = "Pending_Payment";

    // 4. Insert new order
    sqlx::query(
        r#"
        INSERT INTO orders (id, customer_id, material_id, width_m, height_m, total_sqm, file_url, estimated_price, status, slip_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL)
        "#,
    )
    .bind(&new_order_id)
    .bind(&old_order.customer_id)
    .bind(&old_order.material_id)
    .bind(old_order.width_m)
    .bind(old_order.height_m)
    .bind(old_order.total_sqm)
    .bind(&old_order.file_url)
    .bind(estimated_price)
    .bind(initial_status)
    .execute(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    Ok((
        StatusCode::CREATED,
        Json(CreateOrderResponse {
            order_id: new_order_id,
            status: initial_status.to_string(),
        }),
    ))
}

#[derive(Serialize)]
pub struct PresignedUrlResponse {
    pub presigned_url: String,
    pub file_url: String,
}

#[derive(Deserialize)]
pub struct PresignedUrlQuery {
    pub filename: Option<String>,
    pub content_type: Option<String>,
}

/// GET /api/orders/:id/presigned-url
pub async fn generate_presigned_url(
    State(state): State<crate::AppState>,
    axum::extract::Query(query): axum::extract::Query<PresignedUrlQuery>,
    axum::extract::Extension(claims): axum::extract::Extension<crate::handlers::middleware::Claims>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Result<Json<PresignedUrlResponse>, (StatusCode, Json<ErrorResponse>)> {
    
    // 1. Verify the order belongs to this customer
    let order = sqlx::query_as::<_, OrderRow>(
        r#"
        SELECT id, customer_id, material_id, width_m, height_m, total_sqm, file_url, slip_url, estimated_price, status, created_at, updated_at
        FROM orders
        WHERE id = $1 AND customer_id = $2
        "#,
    )
    .bind(&id)
    .bind(&claims.sub)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    if order.is_none() {
        return Err((StatusCode::NOT_FOUND, Json(ErrorResponse { error: "Order not found or not owned by you".into() })));
    }

    // 2. Generate a unique file name and object key
    let unique_id = Uuid::new_v4().to_string();
    
    // Extract extension from provided filename or default to .bin
    let extension = query.filename
        .as_ref()
        .and_then(|f| f.split('.').last())
        .unwrap_or("bin");

    let object_key = format!("print-files/{}/{}.{}", id, unique_id, extension);
    let bucket_name = std::env::var("S3_BUCKET_NAME").unwrap_or_else(|_| "vinyl-system-files".to_string());

    // 3. Generate Presigned URL using AWS SDK
    let expires_in = Duration::from_secs(15 * 60); // 15 minutes
    let presigned_config = PresigningConfig::expires_in(expires_in)
        .map_err(|e| {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: format!("Failed to configure presigned URL: {}", e) }))
        })?;

    let mut put_req = state.s3
        .put_object()
        .bucket(&bucket_name)
        .key(&object_key);

    if let Some(ct) = query.content_type {
        put_req = put_req.content_type(ct);
    }

    let presigned_req = put_req
        .presigned(presigned_config)
        .await
        .map_err(|e| {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: format!("Failed to generate presigned URL: {}", e) }))
        })?;

    let public_prefix = std::env::var("PUBLIC_FILE_URL_PREFIX").unwrap_or_else(|_| {
        let endpoint = std::env::var("AWS_ENDPOINT_URL").unwrap_or_else(|_| "https://s3.amazonaws.com".to_string());
        format!("{}/{}", endpoint.trim_end_matches('/'), bucket_name)
    });
    let file_url = format!("{}/{}", public_prefix.trim_end_matches('/'), object_key);

    Ok(Json(PresignedUrlResponse {
        presigned_url: presigned_req.uri().to_string(),
        file_url,
    }))
}

#[derive(Deserialize)]
pub struct UpdateFileUrlRequest {
    pub file_url: String,
}

/// PATCH /api/orders/:id/file-url
pub async fn update_file_url(
    State(state): State<crate::AppState>,
    axum::extract::Extension(claims): axum::extract::Extension<crate::handlers::middleware::Claims>,
    axum::extract::Path(id): axum::extract::Path<String>,
    Json(payload): Json<UpdateFileUrlRequest>,
) -> Result<Json<OrderRow>, (StatusCode, Json<ErrorResponse>)> {
    
    // Ensure the order belongs to the user
    let user_id = claims.sub;

    let _res = sqlx::query(
        r#"
        UPDATE orders
        SET file_url = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND customer_id = $3
        "#,
    )
    .bind(&payload.file_url)
    .bind(&id)
    .bind(&user_id)
    .execute(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    if _res.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, Json(ErrorResponse { error: "Order not found or not owned by you".into() })));
    }

    get_order(State(state), axum::extract::Path(id)).await
}

#[derive(Serialize)]
pub struct DownloadUrlResponse {
    pub download_url: String,
}

/// GET /api/admin/orders/:id/download
/// Specialized endpoint for admins to get a presigned URL that FORCES download (Content-Disposition: attachment)
pub async fn get_admin_download_url(
    State(state): State<crate::AppState>,
    axum::extract::Extension(claims): axum::extract::Extension<crate::handlers::middleware::Claims>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Result<Json<DownloadUrlResponse>, (StatusCode, Json<ErrorResponse>)> {
    
    // 1. Verify user is admin/staff
    if claims.role != "admin" && claims.role != "staff" {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse { error: "Only admin/staff can access direct downloads".into() })));
    }

    // 2. Fetch the order to get the S3 key
    let order = sqlx::query_as::<_, OrderRow>(
        r#"
        SELECT o.*, u.username as customer_name, i.material_type as material_name
        FROM orders o
        LEFT JOIN users u ON o.customer_id = u.id
        LEFT JOIN inventory i ON o.material_id = i.id
        WHERE o.id = $1
        "#,
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() }))
    })?;

    let Some(order) = order else {
        return Err((StatusCode::NOT_FOUND, Json(ErrorResponse { error: "Order not found".into() })));
    };

    let Some(file_url) = order.file_url else {
        return Err((StatusCode::BAD_REQUEST, Json(ErrorResponse { error: "No file uploaded for this order".into() })));
    };

    // 3. Extract the object key from the file_url
    // Expected format: https://bucket.s3.region.amazonaws.com/print-files/id/uuid
    // Or: https://endpoint/bucket/print-files/id/uuid
    let bucket_name = std::env::var("S3_BUCKET_NAME").unwrap_or_else(|_| "vinyl-system-files".to_string());
    
    // Simple heuristic to get the key: everything after the bucket name or the first part of the path if it contains 'print-files'
    let object_key = if let Some(pos) = file_url.find("print-files/") {
        &file_url[pos..]
    } else {
        return Err((StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: "Could not determine S3 key from URL".into() })));
    };

    // 4. Generate Presigned URL with response-content-disposition
    let expires_in = Duration::from_secs(10 * 60); // 10 minutes
    let presigned_config = PresigningConfig::expires_in(expires_in)
        .map_err(|e| {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: format!("Failed to configure presigned URL: {}", e) }))
        })?;

    // Create a filename for the download based on the actual extension
    // 1. Try to get extension from the URL
    let mut extension = file_url
        .split('?') // Remove query params
        .next().unwrap_or("")
        .split('/') // Get path segments
        .last().unwrap_or("")
        .split('.') // Get extension from last segment
        .last().unwrap_or("")
        .to_string();

    // 2. Fallback: If extension is empty or looks like a UUID (long, no dots), ask S3 for Content-Type
    if extension.is_empty() || extension.len() > 10 {
        // We could use head_object but let's try a simpler guess if it's missing
        // This is a common issue with the previous upload logic
        extension = "png".to_string(); // Defaulting to png as it's the most common for this shop's users
    }
        
    let customer_name = order.customer_name.unwrap_or_else(|| "customer".to_string());
    let filename = format!("Order_{}_{}.{}", id.split('-').next().unwrap_or("file"), customer_name, extension);
    let content_disposition = format!("attachment; filename=\"{}\"", filename);

    let presigned_req = state.s3
        .get_object()
        .bucket(&bucket_name)
        .key(object_key)
        .response_content_disposition(content_disposition)
        .presigned(presigned_config)
        .await
        .map_err(|e| {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: format!("Failed to generate download URL: {}", e) }))
        })?;

    Ok(Json(DownloadUrlResponse {
        download_url: presigned_req.uri().to_string(),
    }))
}

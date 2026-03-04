use axum::{routing::post, Router};
use sqlx::sqlite::{SqlitePoolOptions, SqliteConnectOptions, SqlitePool};
use std::str::FromStr;
use std::env;
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;
use aws_sdk_s3::Client as S3Client;

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
    pub s3: S3Client,
}

mod handlers;

#[tokio::main]
async fn main() {
    // Load environment variables from .env file
    dotenvy::dotenv().ok();

    // Ensure uploads directory exists
    tokio::fs::create_dir_all("uploads").await.unwrap_or_else(|err| {
        println!("Failed to create uploads directory: {}", err);
    });

    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite://vinyl.db".to_string()); // Default to local sqlite file

    let connection_options = SqliteConnectOptions::from_str(&database_url)
        .unwrap()
        .create_if_missing(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(connection_options)
        .await
        .unwrap_or_else(|err| {
            println!("Failed to connect to database. Make sure you have a valid SQLite URL. Error: {}", err);
            panic!("DB connection error: {}", err);
        });

    println!("Running database migrations...");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .unwrap_or_else(|err| {
            println!("Failed to run migrations: {}", err);
            panic!("Migration error: {}", err);
        });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Initialize AWS S3 Client
    let region = env::var("AWS_REGION").unwrap_or_else(|_| "auto".to_string());
    println!("AWS Region: {}", region);
    
    let mut config_loader = aws_config::defaults(aws_config::BehaviorVersion::latest())
        .region(aws_config::meta::region::RegionProviderChain::first_try(aws_config::Region::new(region)));
        
    if let Ok(endpoint) = env::var("AWS_ENDPOINT_URL") {
        println!("AWS Endpoint: {}", endpoint);
        config_loader = config_loader.endpoint_url(endpoint);
    } else {
        println!("WARNING: AWS_ENDPOINT_URL not found in .env");
    }
    
    if let (Ok(key), Ok(secret)) = (env::var("AWS_ACCESS_KEY_ID"), env::var("AWS_SECRET_ACCESS_KEY")) {
        println!("AWS Credentials Loaded from .env (Key starts with: {})", &key[..4.min(key.len())]);
        config_loader = config_loader.credentials_provider(aws_sdk_s3::config::Credentials::new(
            key, secret, None, None, "env"
        ));
    } else {
        println!("WARNING: AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY not found in .env");
    }

    let aws_config = config_loader.load().await;
    
    let s3_config = aws_sdk_s3::config::Builder::from(&aws_config)
        .force_path_style(true)
        .build();
    
    let s3_client = S3Client::from_conf(s3_config);

    let state = AppState {
        db: pool,
        s3: s3_client,
    };

    let auth_routes = Router::new()
        .route("/api/orders", axum::routing::get(handlers::orders::list_orders))
        .route("/api/orders/:id", axum::routing::get(handlers::orders::get_order))
        .route("/api/orders/:id/status", axum::routing::patch(handlers::orders::update_order_status))
        .route("/api/orders/:id/slip", axum::routing::patch(handlers::orders::upload_slip))
        .route("/api/orders/:id/reorder", axum::routing::post(handlers::orders::reorder))
        .route("/api/orders/:id/presigned-url", axum::routing::get(handlers::orders::generate_presigned_url))
        .route("/api/orders/:id/file-url", axum::routing::patch(handlers::orders::update_file_url))
        .route("/api/customer/orders", axum::routing::get(handlers::orders::get_customer_orders))
        .route("/api/admin/orders/:id/download", axum::routing::get(handlers::orders::get_admin_download_url))
        .route("/api/admin/inventory", axum::routing::get(handlers::inventory::list_all_inventory))
        .route("/api/inventory", axum::routing::post(handlers::inventory::create_inventory))
        .route("/api/inventory/:id", axum::routing::patch(handlers::inventory::update_inventory))
        .route("/api/user/profile", axum::routing::get(handlers::profile::get_profile))
        .route("/api/user/profile", axum::routing::put(handlers::profile::update_profile))
        .route("/api/admin/users", axum::routing::get(handlers::auth::list_users))
        .route("/api/admin/users/:id/role", axum::routing::patch(handlers::auth::update_user_role))
        .route("/api/admin/analytics/summary", axum::routing::get(handlers::analytics::get_analytics_summary))
        .route("/api/admin/showcase", axum::routing::get(handlers::showcase::admin_list_showcase))
        .route("/api/admin/showcase", axum::routing::post(handlers::showcase::create_showcase_item))
        .route("/api/admin/showcase/:id", axum::routing::patch(handlers::showcase::update_showcase_item))
        .route("/api/admin/showcase/:id", axum::routing::delete(handlers::showcase::delete_showcase_item))
        .route("/api/admin/showcase/upload", axum::routing::post(handlers::showcase::upload_showcase_image))
        .route_layer(axum::middleware::from_fn(handlers::middleware::auth_middleware));

    let app = Router::new()
        .route("/api/calculator", post(handlers::calculator::calculate_price))
        .route("/api/orders", post(handlers::orders::create_order)) // Customers can currently create without auth
        .route("/api/login", post(handlers::auth::login))
        .route("/api/register", post(handlers::auth::register))
        .route("/api/inventory", axum::routing::get(handlers::inventory::list_inventory))
        .route("/api/showcase", axum::routing::get(handlers::showcase::list_showcase))
        .nest_service("/uploads", ServeDir::new("uploads"))
        .merge(auth_routes)
        .layer(cors)
        .with_state(state);

    let addr = "0.0.0.0:3001";
    let listener = match TcpListener::bind(addr).await {
        Ok(l) => l,
        Err(e) => {
            eprintln!("❌ FATAL ERROR: Could not bind to {} - {}", addr, e);
            eprintln!("💡 TIP: Check if another instance of the backend is already running on port 3001.");
            return;
        }
    };
    println!("🚀 Backend listening on http://{}", addr);
    if let Err(e) = axum::serve(listener, app).await {
        eprintln!("❌ Server error: {}", e);
    }
}

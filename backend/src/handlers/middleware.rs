use axum::{
    extract::Request,
    middleware::Next,
    response::Response,
    http::{StatusCode, header},
    Json,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,
    pub role: String,
    pub exp: usize,
}

#[derive(Serialize)]
pub struct AuthErrorResponse {
    pub error: String,
}

pub async fn auth_middleware(mut req: Request, next: Next) -> Result<Response, (StatusCode, Json<AuthErrorResponse>)> {
    let err_response = || (
        StatusCode::UNAUTHORIZED,
        Json(AuthErrorResponse { error: "Invalid or missing token".into() }),
    );

    let auth_header = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(token) => token,
        None => return Err(err_response()),
    };

    let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "super_secret_dev_key_only_vinyl_store".to_string());
    
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_bytes()),
        &Validation::default(),
    ).map_err(|_| err_response())?;

    req.extensions_mut().insert(token_data.claims);

    Ok(next.run(req).await)
}

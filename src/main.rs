mod db;
mod resources;
mod types;

use cinderblock_core::Context;
use cinderblock_sqlx::sqlite::SqliteDataLayer;
use tower_http::cors::{Any, CorsLayer};

#[tokio::main]
async fn main() -> cinderblock_core::Result<()> {
    tracing_subscriber::fmt::init();

    let dl = SqliteDataLayer::new("sqlite:ticketing.db?mode=rwc").await?;
    db::setup(&dl).await?;

    let mut ctx = Context::new();
    ctx.register_data_layer(dl);

    resources::seed(&ctx).await?;

    let api = cinderblock_json_api::RouterConfig::new(ctx)
        .swagger_ui(true)
        .build();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let router = api.layer(cors);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await?;
    tracing::info!("Backend at http://localhost:3001");
    tracing::info!("Swagger UI at http://localhost:3001/swagger-ui");

    cinderblock_json_api::axum::serve(listener, router).await?;

    Ok(())
}

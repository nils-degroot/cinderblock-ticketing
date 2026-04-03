use cinderblock_core::serde::{Deserialize, Serialize};

#[derive(
    Debug,
    Clone,
    Default,
    PartialEq,
    Eq,
    Serialize,
    Deserialize,
    sqlx::Type,
    cinderblock_json_api::utoipa::ToSchema,
)]
pub enum TicketStatus {
    #[default]
    Open,
    InProgress,
    Resolved,
    Closed,
}

cinderblock_json_api::impl_field_schema!(TicketStatus);

#[derive(
    Debug,
    Clone,
    Default,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    Serialize,
    Deserialize,
    sqlx::Type,
    cinderblock_json_api::utoipa::ToSchema,
)]
pub enum TicketPriority {
    Low,
    #[default]
    Medium,
    High,
    Urgent,
}

cinderblock_json_api::impl_field_schema!(TicketPriority);

#[derive(
    Debug,
    Clone,
    Default,
    PartialEq,
    Eq,
    Serialize,
    Deserialize,
    sqlx::Type,
    cinderblock_json_api::utoipa::ToSchema,
)]
pub enum UserRole {
    Admin,
    Agent,
    #[default]
    Customer,
}

cinderblock_json_api::impl_field_schema!(UserRole);

use cinderblock_sqlx::sqlite::SqliteDataLayer;

pub async fn setup(dl: &SqliteDataLayer) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS users (
            user_id TEXT NOT NULL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            role TEXT NOT NULL
        )",
    )
    .execute(dl.pool())
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS labels (
            label_id TEXT NOT NULL PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT NOT NULL
        )",
    )
    .execute(dl.pool())
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS tickets (
            ticket_id TEXT NOT NULL PRIMARY KEY,
            subject TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL,
            priority TEXT NOT NULL,
            reporter_id TEXT NOT NULL REFERENCES users(user_id),
            assignee_id TEXT NOT NULL REFERENCES users(user_id),
            label_id TEXT NOT NULL REFERENCES labels(label_id),
            created_at TEXT NOT NULL
        )",
    )
    .execute(dl.pool())
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS comments (
            comment_id TEXT NOT NULL PRIMARY KEY,
            ticket_id TEXT NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES users(user_id),
            body TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
    )
    .execute(dl.pool())
    .await?;

    Ok(())
}

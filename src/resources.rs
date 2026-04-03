use cinderblock_core::resource;
use uuid::Uuid;

use crate::types::{TicketPriority, TicketStatus, UserRole};

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

resource! {
    name = Ticketing.Support.User;
    data_layer = cinderblock_sqlx::sqlite::SqliteDataLayer;

    attributes {
        user_id Uuid {
            primary_key true;
            writable false;
            default || uuid::Uuid::new_v4();
        }

        name String;
        email String;
        role UserRole;
    }

    relations {
        has_many assigned_tickets {
            ty Ticket;
            source_attribute assignee_id;
        };
    }

    actions {
        read all_users;

        read all_users_with_tickets {
            load [assigned_tickets];
        };

        read agents {
            filter { role == UserRole::Agent };
        };

        create create_user;
    }

    extensions {
        cinderblock_json_api {
            route = { method = GET; path = "/"; action = all_users; };
            route = { method = GET; path = "/with-tickets"; action = all_users_with_tickets; };
            route = { method = GET; path = "/agents"; action = agents; };
            route = { method = POST; path = "/"; action = create_user; };
        };

        cinderblock_sqlx {
            table = "users";
        };
    }
}

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

resource! {
    name = Ticketing.Support.Label;
    data_layer = cinderblock_sqlx::sqlite::SqliteDataLayer;

    attributes {
        label_id Uuid {
            primary_key true;
            writable false;
            default || uuid::Uuid::new_v4();
        }

        name String;
        color String;
    }

    actions {
        read all_labels;
        create create_label;
        destroy delete_label;
    }

    extensions {
        cinderblock_json_api {
            route = { method = GET; path = "/"; action = all_labels; };
            route = { method = POST; path = "/"; action = create_label; };
            route = { method = DELETE; path = "/{primary_key}"; action = delete_label; };
        };

        cinderblock_sqlx {
            table = "labels";
        };
    }
}

// ---------------------------------------------------------------------------
// Ticket
// ---------------------------------------------------------------------------

resource! {
    name = Ticketing.Support.Ticket;
    data_layer = cinderblock_sqlx::sqlite::SqliteDataLayer;

    attributes {
        ticket_id Uuid {
            primary_key true;
            writable false;
            default || uuid::Uuid::new_v4();
        }

        subject String;
        description String;
        status TicketStatus;
        priority TicketPriority;
        reporter_id Uuid;
        assignee_id Uuid;
        label_id Uuid;
        created_at String {
            writable false;
            default || chrono::Utc::now().to_rfc3339();
        }
    }

    relations {
        belongs_to reporter {
            ty User;
            source_attribute reporter_id;
        };

        belongs_to assignee {
            ty User;
            source_attribute assignee_id;
        };

        belongs_to label {
            ty Label;
            source_attribute label_id;
        };

        has_many comments {
            ty Comment;
            source_attribute ticket_id;
        };
    }

    actions {
        read all_tickets {
            paged {
                default_per_page 20;
                max_per_page 50;
            };
        };

        read all_tickets_detail {
            load [reporter, assignee, label, comments];
        };

        read by_status {
            argument { status: TicketStatus };
            filter { status == arg(status) };

            paged {
                default_per_page 20;
            };
        };

        read by_priority {
            argument { priority: TicketPriority };
            filter { priority == arg(priority) };
        };

        read by_assignee {
            argument { assignee_id: Uuid };
            filter { assignee_id == arg(assignee_id) };
        };

        create open_ticket;

        update assign_ticket {
            accept [assignee_id];
            change_ref |ticket| {
                ticket.status = TicketStatus::InProgress;
            };
        };

        update resolve_ticket {
            accept [];
            change_ref |ticket| {
                ticket.status = TicketStatus::Resolved;
            };
        };

        update close_ticket {
            accept [];
            change_ref |ticket| {
                ticket.status = TicketStatus::Closed;
            };
        };

        update update_priority {
            accept [priority];
        };

        destroy delete_ticket;
    }

    extensions {
        cinderblock_json_api {
            route = { method = GET; path = "/"; action = all_tickets; };
            route = { method = GET; path = "/detail"; action = all_tickets_detail; };
            route = { method = GET; path = "/by-status"; action = by_status; };
            route = { method = GET; path = "/by-priority"; action = by_priority; };
            route = { method = GET; path = "/by-assignee"; action = by_assignee; };
            route = { method = POST; path = "/"; action = open_ticket; };
            route = { method = PATCH; path = "/{primary_key}/assign"; action = assign_ticket; };
            route = { method = PATCH; path = "/{primary_key}/resolve"; action = resolve_ticket; };
            route = { method = PATCH; path = "/{primary_key}/close"; action = close_ticket; };
            route = { method = PATCH; path = "/{primary_key}/priority"; action = update_priority; };
            route = { method = DELETE; path = "/{primary_key}"; action = delete_ticket; };
        };

        cinderblock_sqlx {
            table = "tickets";
        };
    }
}

// ---------------------------------------------------------------------------
// Comment
// ---------------------------------------------------------------------------

resource! {
    name = Ticketing.Support.Comment;
    data_layer = cinderblock_sqlx::sqlite::SqliteDataLayer;

    attributes {
        comment_id Uuid {
            primary_key true;
            writable false;
            default || uuid::Uuid::new_v4();
        }

        ticket_id Uuid;
        user_id Uuid;
        body String;
        created_at String {
            writable false;
            default || chrono::Utc::now().to_rfc3339();
        }
    }

    relations {
        belongs_to user {
            ty User;
            source_attribute user_id;
        };

        belongs_to ticket {
            ty Ticket;
            source_attribute ticket_id;
        };
    }

    actions {
        read all_comments;

        read by_ticket {
            argument { ticket_id: Uuid };
            filter { ticket_id == arg(ticket_id) };
        };

        read by_ticket_with_user {
            argument { ticket_id: Uuid };
            filter { ticket_id == arg(ticket_id) };
            load [user];
        };

        create add_comment;
        destroy delete_comment;
    }

    extensions {
        cinderblock_json_api {
            route = { method = GET; path = "/"; action = all_comments; };
            route = { method = GET; path = "/by-ticket"; action = by_ticket; };
            route = { method = GET; path = "/by-ticket/with-user"; action = by_ticket_with_user; };
            route = { method = POST; path = "/"; action = add_comment; };
            route = { method = DELETE; path = "/{primary_key}"; action = delete_comment; };
        };

        cinderblock_sqlx {
            table = "comments";
        };
    }
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

use cinderblock_core::Context;

pub async fn seed(ctx: &Context) -> cinderblock_core::Result<()> {
    use crate::types::{TicketPriority, TicketStatus, UserRole};

    // Check if data already exists
    let existing = cinderblock_core::read::<User, AllUsers>(ctx, &()).await?;
    if !existing.is_empty() {
        tracing::info!("Seed data already present, skipping");
        return Ok(());
    }

    tracing::info!("Seeding demo data…");

    // --- Users ---
    let alice = cinderblock_core::create::<User, CreateUser>(
        CreateUserInput {
            name: "Alice Chen".to_string(),
            email: "alice@example.com".to_string(),
            role: UserRole::Admin,
        },
        ctx,
    )
    .await?;

    let bob = cinderblock_core::create::<User, CreateUser>(
        CreateUserInput {
            name: "Bob Martinez".to_string(),
            email: "bob@example.com".to_string(),
            role: UserRole::Agent,
        },
        ctx,
    )
    .await?;

    let carol = cinderblock_core::create::<User, CreateUser>(
        CreateUserInput {
            name: "Carol Davis".to_string(),
            email: "carol@example.com".to_string(),
            role: UserRole::Agent,
        },
        ctx,
    )
    .await?;

    let dave = cinderblock_core::create::<User, CreateUser>(
        CreateUserInput {
            name: "Dave Wilson".to_string(),
            email: "dave@example.com".to_string(),
            role: UserRole::Customer,
        },
        ctx,
    )
    .await?;

    let eve = cinderblock_core::create::<User, CreateUser>(
        CreateUserInput {
            name: "Eve Thompson".to_string(),
            email: "eve@example.com".to_string(),
            role: UserRole::Customer,
        },
        ctx,
    )
    .await?;

    // --- Labels ---
    let bug = cinderblock_core::create::<Label, CreateLabel>(
        CreateLabelInput {
            name: "Bug".to_string(),
            color: "#ef4444".to_string(),
        },
        ctx,
    )
    .await?;

    let feature = cinderblock_core::create::<Label, CreateLabel>(
        CreateLabelInput {
            name: "Feature".to_string(),
            color: "#3b82f6".to_string(),
        },
        ctx,
    )
    .await?;

    let docs = cinderblock_core::create::<Label, CreateLabel>(
        CreateLabelInput {
            name: "Documentation".to_string(),
            color: "#8b5cf6".to_string(),
        },
        ctx,
    )
    .await?;

    let urgent = cinderblock_core::create::<Label, CreateLabel>(
        CreateLabelInput {
            name: "Urgent".to_string(),
            color: "#f97316".to_string(),
        },
        ctx,
    )
    .await?;

    // --- Tickets ---
    let t1 = cinderblock_core::create::<Ticket, OpenTicket>(
        OpenTicketInput {
            subject: "Login page returns 500 error".to_string(),
            description: "When trying to log in with valid credentials, the server returns a 500 Internal Server Error. Started happening after the latest deployment.".to_string(),
            status: TicketStatus::Open,
            priority: TicketPriority::Urgent,
            reporter_id: dave.user_id,
            assignee_id: bob.user_id,
            label_id: bug.label_id,
        },
        ctx,
    )
    .await?;

    let t2 = cinderblock_core::create::<Ticket, OpenTicket>(
        OpenTicketInput {
            subject: "Add dark mode support".to_string(),
            description: "Users have been requesting dark mode for a while. Would be great to add it as a toggle in the settings page.".to_string(),
            status: TicketStatus::Open,
            priority: TicketPriority::Medium,
            reporter_id: eve.user_id,
            assignee_id: carol.user_id,
            label_id: feature.label_id,
        },
        ctx,
    )
    .await?;

    let t3 = cinderblock_core::create::<Ticket, OpenTicket>(
        OpenTicketInput {
            subject: "Update API documentation for v2 endpoints".to_string(),
            description: "The API docs are outdated and still reference v1 endpoints. Need to update all examples and endpoint descriptions.".to_string(),
            status: TicketStatus::InProgress,
            priority: TicketPriority::Low,
            reporter_id: alice.user_id,
            assignee_id: carol.user_id,
            label_id: docs.label_id,
        },
        ctx,
    )
    .await?;

    let t4 = cinderblock_core::create::<Ticket, OpenTicket>(
        OpenTicketInput {
            subject: "Database connection pool exhaustion under load".to_string(),
            description: "During peak hours the application becomes unresponsive. Logs show connection pool timeouts. Need to investigate pool sizing and query performance.".to_string(),
            status: TicketStatus::InProgress,
            priority: TicketPriority::High,
            reporter_id: bob.user_id,
            assignee_id: bob.user_id,
            label_id: bug.label_id,
        },
        ctx,
    )
    .await?;

    let t5 = cinderblock_core::create::<Ticket, OpenTicket>(
        OpenTicketInput {
            subject: "CSV export takes too long for large datasets".to_string(),
            description: "Exporting more than 10k rows to CSV causes the browser to hang. Should implement server-side streaming.".to_string(),
            status: TicketStatus::Open,
            priority: TicketPriority::Medium,
            reporter_id: dave.user_id,
            assignee_id: bob.user_id,
            label_id: feature.label_id,
        },
        ctx,
    )
    .await?;

    let _t6 = cinderblock_core::create::<Ticket, OpenTicket>(
        OpenTicketInput {
            subject: "Password reset email not sending".to_string(),
            description: "Customers report that they never receive the password reset email. SMTP logs look clean on our end.".to_string(),
            status: TicketStatus::Resolved,
            priority: TicketPriority::Urgent,
            reporter_id: eve.user_id,
            assignee_id: carol.user_id,
            label_id: urgent.label_id,
        },
        ctx,
    )
    .await?;

    let _t7 = cinderblock_core::create::<Ticket, OpenTicket>(
        OpenTicketInput {
            subject: "Migrate CI pipeline to GitHub Actions".to_string(),
            description: "Our Jenkins server is EOL. Need to migrate all pipelines to GitHub Actions before the end of the quarter.".to_string(),
            status: TicketStatus::Closed,
            priority: TicketPriority::Low,
            reporter_id: alice.user_id,
            assignee_id: bob.user_id,
            label_id: feature.label_id,
        },
        ctx,
    )
    .await?;

    // --- Comments ---
    cinderblock_core::create::<Comment, AddComment>(
        AddCommentInput {
            ticket_id: t1.ticket_id,
            user_id: bob.user_id,
            body: "I can reproduce this. Looks like the auth middleware is failing on the new session format. Investigating.".to_string(),
        },
        ctx,
    )
    .await?;

    cinderblock_core::create::<Comment, AddComment>(
        AddCommentInput {
            ticket_id: t1.ticket_id,
            user_id: alice.user_id,
            body: "This is high priority — several customers are affected. Can we get a hotfix out today?".to_string(),
        },
        ctx,
    )
    .await?;

    cinderblock_core::create::<Comment, AddComment>(
        AddCommentInput {
            ticket_id: t2.ticket_id,
            user_id: carol.user_id,
            body: "I've started a design mockup for the dark mode toggle. Will share it by end of week.".to_string(),
        },
        ctx,
    )
    .await?;

    cinderblock_core::create::<Comment, AddComment>(
        AddCommentInput {
            ticket_id: t3.ticket_id,
            user_id: carol.user_id,
            body: "Updated the authentication endpoints. Still working on the resource management section.".to_string(),
        },
        ctx,
    )
    .await?;

    cinderblock_core::create::<Comment, AddComment>(
        AddCommentInput {
            ticket_id: t4.ticket_id,
            user_id: bob.user_id,
            body: "Increased pool size from 10 to 25 and added query timeout of 30s. Monitoring for improvements.".to_string(),
        },
        ctx,
    )
    .await?;

    cinderblock_core::create::<Comment, AddComment>(
        AddCommentInput {
            ticket_id: t4.ticket_id,
            user_id: dave.user_id,
            body: "The issue seems less frequent now but still happens during peak hours around 2-3pm EST.".to_string(),
        },
        ctx,
    )
    .await?;

    cinderblock_core::create::<Comment, AddComment>(
        AddCommentInput {
            ticket_id: t5.ticket_id,
            user_id: eve.user_id,
            body: "This is really impacting our monthly reporting workflow. Would love to see this fixed soon.".to_string(),
        },
        ctx,
    )
    .await?;

    tracing::info!("Seeded 5 users, 4 labels, 7 tickets, 7 comments");

    Ok(())
}

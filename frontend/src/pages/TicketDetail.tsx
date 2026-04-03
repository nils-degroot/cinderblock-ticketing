import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTicketAllTicketsOptions,
  getCommentByTicketOptions,
  getUserAllUsersOptions,
  getLabelAllLabelsOptions,
  patchTicketAssignTicketMutation,
  patchTicketResolveTicketMutation,
  patchTicketCloseTicketMutation,
  patchTicketUpdatePriorityMutation,
  postCommentAddCommentMutation,
  deleteTicketDeleteTicketMutation,
} from "../client/@tanstack/react-query.gen";
import type { Ticket, Comment } from "../client/types.gen";

const statusColors: Record<string, string> = {
  Open: "bg-blue-100 text-blue-700",
  InProgress: "bg-yellow-100 text-yellow-800",
  Resolved: "bg-green-100 text-green-700",
  Closed: "bg-gray-100 text-gray-600",
};

const priorityColors: Record<string, string> = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-blue-100 text-blue-700",
  High: "bg-orange-100 text-orange-700",
  Urgent: "bg-red-100 text-red-700",
};

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [commentBody, setCommentBody] = useState("");

  // Fetch all tickets and find this one (no single-ticket endpoint)
  const ticketsQuery = useQuery(
    getTicketAllTicketsOptions({ query: { per_page: 100 } }),
  );
  const commentsQuery = useQuery(
    getCommentByTicketOptions({ query: { ticket_id: id! } }),
  );
  const usersQuery = useQuery(getUserAllUsersOptions());
  const labelsQuery = useQuery(getLabelAllLabelsOptions());

  const ticket = (ticketsQuery.data?.data as Ticket[] | undefined)?.find(
    (t) => t.ticket_id === id,
  );
  const comments = (commentsQuery.data?.data ?? []) as Comment[];
  const users = usersQuery.data?.data ?? [];
  const labels = labelsQuery.data?.data ?? [];

  const usersById = Object.fromEntries(users.map((u) => [u.user_id, u]));
  const label = labels.find((l) => l.label_id === ticket?.label_id);

  const refreshData = () => {
    ticketsQuery.refetch();
    commentsQuery.refetch();
  };

  const resolveMutation = useMutation({
    ...patchTicketResolveTicketMutation(),
    onSuccess: refreshData,
  });

  const closeMutation = useMutation({
    ...patchTicketCloseTicketMutation(),
    onSuccess: refreshData,
  });

  const assignMutation = useMutation({
    ...patchTicketAssignTicketMutation(),
    onSuccess: refreshData,
  });

  const priorityMutation = useMutation({
    ...patchTicketUpdatePriorityMutation(),
    onSuccess: refreshData,
  });

  const addCommentMutation = useMutation({
    ...postCommentAddCommentMutation(),
    onSuccess: () => {
      setCommentBody("");
      refreshData();
    },
  });

  const deleteMutation = useMutation({
    ...deleteTicketDeleteTicketMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getTicketAllTicketsOptions().queryKey });
      navigate("/tickets");
    },
  });

  const isLoading =
    ticketsQuery.isLoading ||
    commentsQuery.isLoading ||
    usersQuery.isLoading ||
    labelsQuery.isLoading;

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ticket not found</p>
        <Link
          to="/tickets"
          className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to tickets
        </Link>
      </div>
    );
  }

  const reporter = usersById[ticket.reporter_id];
  const agents = users.filter((u) => u.role === "Agent" || u.role === "Admin");

  // Use first agent as the "current user" for comments
  const currentUser = agents[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link
            to="/tickets"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; Back to tickets
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[ticket.status]}`}
            >
              {ticket.status === "InProgress" ? "In Progress" : ticket.status}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[ticket.priority]}`}
            >
              {ticket.priority}
            </span>
            {label && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-0.5 text-xs text-gray-600">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                {label.name}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {ticket.status === "Open" && (
            <button
              onClick={() =>
                resolveMutation.mutate({
                  path: { primary_key: ticket.ticket_id },
                  body: {},
                })
              }
              disabled={resolveMutation.isPending}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
            >
              Resolve
            </button>
          )}
          {ticket.status === "InProgress" && (
            <button
              onClick={() =>
                resolveMutation.mutate({
                  path: { primary_key: ticket.ticket_id },
                  body: {},
                })
              }
              disabled={resolveMutation.isPending}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
            >
              Resolve
            </button>
          )}
          {(ticket.status === "Open" ||
            ticket.status === "InProgress" ||
            ticket.status === "Resolved") && (
            <button
              onClick={() =>
                closeMutation.mutate({
                  path: { primary_key: ticket.ticket_id },
                  body: {},
                })
              }
              disabled={closeMutation.isPending}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Close
            </button>
          )}
          <button
            onClick={() => {
              if (confirm("Delete this ticket?")) {
                deleteMutation.mutate({
                  path: { primary_key: ticket.ticket_id },
                });
              }
            }}
            disabled={deleteMutation.isPending}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          {/* Description */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900">Description</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {/* Comments */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900">
              Comments ({comments.length})
            </h2>
            <div className="mt-4 space-y-4">
              {comments.length === 0 && (
                <p className="text-sm text-gray-400">No comments yet</p>
              )}
              {comments.map((c) => {
                const author = usersById[c.user_id];
                return (
                  <div key={c.comment_id} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                      {author?.name.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {author?.name ?? "Unknown"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                        {c.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add comment */}
            {currentUser && (
              <form
                className="mt-6 border-t border-gray-100 pt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!commentBody.trim()) return;
                  addCommentMutation.mutate({
                    body: {
                      body: commentBody.trim(),
                      ticket_id: ticket.ticket_id,
                      user_id: currentUser.user_id,
                    },
                  });
                }}
              >
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Write a comment..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={
                      addCommentMutation.isPending || !commentBody.trim()
                    }
                    className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                  >
                    {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Details */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-gray-500">Reporter</dt>
                <dd className="mt-0.5 text-sm text-gray-900">
                  {reporter?.name ?? "Unknown"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Assignee</dt>
                <dd className="mt-0.5">
                  <select
                    value={ticket.assignee_id}
                    onChange={(e) =>
                      assignMutation.mutate({
                        path: { primary_key: ticket.ticket_id },
                        body: { assignee_id: e.target.value },
                      })
                    }
                    className="w-full rounded border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    {agents.map((a) => (
                      <option key={a.user_id} value={a.user_id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Priority</dt>
                <dd className="mt-0.5">
                  <select
                    value={ticket.priority}
                    onChange={(e) =>
                      priorityMutation.mutate({
                        path: { primary_key: ticket.ticket_id },
                        body: {
                          priority: e.target.value as Ticket["priority"],
                        },
                      })
                    }
                    className="w-full rounded border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Label</dt>
                <dd className="mt-0.5 text-sm text-gray-900">
                  {label ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      {label.name}
                    </span>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Created</dt>
                <dd className="mt-0.5 text-sm text-gray-900">
                  {new Date(ticket.created_at).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-8 w-80 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 flex gap-2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="h-48 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
          <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
      </div>
    </div>
  );
}

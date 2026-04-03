import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  getTicketAllTicketsOptions,
  getTicketByStatusOptions,
  getTicketByPriorityOptions,
  getUserAllUsersOptions,
  getLabelAllLabelsOptions,
} from "../client/@tanstack/react-query.gen";
import type { Ticket } from "../client/types.gen";

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

type StatusFilter = Ticket["status"] | "all";
type PriorityFilter = Ticket["priority"] | "all";

export default function TicketList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");

  // Use filtered endpoint when a status filter is active, otherwise use paged all
  const allTicketsQuery = useQuery({
    ...getTicketAllTicketsOptions({ query: { page, per_page: 10 } }),
    enabled: statusFilter === "all" && priorityFilter === "all",
  });

  const byStatusQuery = useQuery({
    ...getTicketByStatusOptions({
      query: { status: statusFilter as Ticket["status"], page, per_page: 10 },
    }),
    enabled: statusFilter !== "all" && priorityFilter === "all",
  });

  const byPriorityQuery = useQuery({
    ...getTicketByPriorityOptions({
      query: { priority: priorityFilter as Ticket["priority"] },
    }),
    enabled: priorityFilter !== "all" && statusFilter === "all",
  });

  const usersQuery = useQuery(getUserAllUsersOptions());
  const labelsQuery = useQuery(getLabelAllLabelsOptions());

  const usersById = Object.fromEntries(
    (usersQuery.data?.data ?? []).map((u) => [u.user_id, u]),
  );
  const labelsById = Object.fromEntries(
    (labelsQuery.data?.data ?? []).map((l) => [l.label_id, l]),
  );

  // Determine which data to show
  let tickets: Ticket[] = [];
  let meta: { page: number; total_pages: number } | null = null;
  let isLoading = false;

  if (statusFilter !== "all" && priorityFilter === "all") {
    tickets = (byStatusQuery.data?.data ?? []) as Ticket[];
    meta = byStatusQuery.data?.meta ?? null;
    isLoading = byStatusQuery.isLoading;
  } else if (priorityFilter !== "all" && statusFilter === "all") {
    tickets = (byPriorityQuery.data?.data ?? []) as Ticket[];
    meta = null; // priority endpoint is not paged
    isLoading = byPriorityQuery.isLoading;
  } else {
    tickets = (allTicketsQuery.data?.data ?? []) as Ticket[];
    meta = allTicketsQuery.data?.meta ?? null;
    isLoading = allTicketsQuery.isLoading;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track support requests
          </p>
        </div>
        <Link
          to="/tickets/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setPriorityFilter("all");
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="InProgress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Priority
          </label>
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value as PriorityFilter);
              setStatusFilter("all");
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-500">No tickets found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Label
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Assignee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((t) => {
                const label = labelsById[t.label_id];
                return (
                  <tr key={t.ticket_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        to={`/tickets/${t.ticket_id}`}
                        className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {t.subject}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[t.status]}`}
                      >
                        {t.status === "InProgress" ? "In Progress" : t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[t.priority]}`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {label ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: label.color }}
                          />
                          {label.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {usersById[t.assignee_id]?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {meta.page} of {meta.total_pages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={page >= meta.total_pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-4">
            <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

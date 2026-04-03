import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  getTicketAllTicketsOptions,
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

function countByField<K extends keyof Ticket>(
  tickets: Ticket[],
  field: K,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const t of tickets) {
    const key = String(t[field]);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export default function Dashboard() {
  const ticketsQuery = useQuery(
    getTicketAllTicketsOptions({ query: { per_page: 100 } }),
  );
  const usersQuery = useQuery(getUserAllUsersOptions());
  const labelsQuery = useQuery(getLabelAllLabelsOptions());

  const tickets = ticketsQuery.data?.data ?? [];
  const users = usersQuery.data?.data ?? [];
  const labels = labelsQuery.data?.data ?? [];

  const statusCounts = countByField(tickets, "status");
  const priorityCounts = countByField(tickets, "priority");

  const usersById = Object.fromEntries(users.map((u) => [u.user_id, u]));

  const recentTickets = [...tickets]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);

  const isLoading =
    ticketsQuery.isLoading || usersQuery.isLoading || labelsQuery.isLoading;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your support system
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Tickets" value={tickets.length} />
        <StatCard
          label="Open"
          value={statusCounts["Open"] ?? 0}
          accent="text-blue-600"
        />
        <StatCard
          label="In Progress"
          value={statusCounts["InProgress"] ?? 0}
          accent="text-yellow-600"
        />
        <StatCard
          label="Resolved"
          value={statusCounts["Resolved"] ?? 0}
          accent="text-green-600"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* By Priority */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">By Priority</h2>
          <div className="mt-4 space-y-3">
            {(["Urgent", "High", "Medium", "Low"] as const).map((p) => (
              <div key={p} className="flex items-center justify-between">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[p]}`}
                >
                  {p}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {priorityCounts[p] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Team</h2>
          <div className="mt-4 space-y-3">
            {users.slice(0, 5).map((u) => (
              <div key={u.user_id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-700">{u.name}</span>
                </div>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Labels */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Labels</h2>
          <div className="mt-4 space-y-3">
            {labels.map((l) => (
              <div key={l.label_id} className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: l.color }}
                />
                <span className="text-sm text-gray-700">{l.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Recent Tickets
          </h2>
          <Link
            to="/tickets"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            View all
          </Link>
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
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
                  Assignee
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentTickets.map((t) => (
                <tr key={t.ticket_id} className="hover:bg-gray-50">
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
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {usersById[t.assignee_id]?.name ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent ?? "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
          />
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  getUserAllUsersOptions,
  getTicketAllTicketsOptions,
  getTicketByAssigneeOptions,
  postUserCreateUserMutation,
} from "../client/@tanstack/react-query.gen";
import type { Ticket, User } from "../client/types.gen";

const roleColors: Record<string, string> = {
  Admin: "bg-purple-100 text-purple-700",
  Agent: "bg-blue-100 text-blue-700",
  Customer: "bg-green-100 text-green-700",
};

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

type RoleFilter = User["role"] | "all";

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

export default function TeamManagement() {
  const queryClient = useQueryClient();

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<User["role"]>("Agent");

  // Data fetching
  const usersQuery = useQuery(getUserAllUsersOptions());
  const ticketsQuery = useQuery(
    getTicketAllTicketsOptions({ query: { per_page: 100 } }),
  );
  const assigneeTicketsQuery = useQuery({
    ...getTicketByAssigneeOptions({
      query: { assignee_id: selectedUserId! },
    }),
    enabled: !!selectedUserId,
  });

  const users = usersQuery.data?.data ?? [];
  const tickets = (ticketsQuery.data?.data ?? []) as Ticket[];
  const assigneeTickets = (assigneeTicketsQuery.data?.data ?? []) as Ticket[];

  const ticketCountsByAssignee = countByField(tickets, "assignee_id");

  // Create user mutation
  const createMutation = useMutation({
    ...postUserCreateUserMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getUserAllUsersOptions().queryKey });
      setShowForm(false);
      setFormName("");
      setFormEmail("");
      setFormRole("Agent");
    },
  });

  const isLoading = usersQuery.isLoading || ticketsQuery.isLoading;

  if (isLoading) {
    return <TeamSkeleton />;
  }

  // Stats
  const roleCounts: Record<string, number> = {};
  for (const u of users) {
    roleCounts[u.role] = (roleCounts[u.role] ?? 0) + 1;
  }

  // Filtered users
  const filteredUsers =
    roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter);

  const roleFilterTabs: { value: RoleFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "Admin", label: "Admin" },
    { value: "Agent", label: "Agent" },
    { value: "Customer", label: "Customer" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage team members and roles
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add Member
        </button>
      </div>

      {/* Add Member Form */}
      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!formName.trim() || !formEmail.trim()) return;
            createMutation.mutate({
              body: {
                name: formName.trim(),
                email: formEmail.trim(),
                role: formRole,
              },
            });
          }}
          className="rounded-xl border border-gray-200 bg-white p-6 space-y-4"
        >
          <h2 className="text-sm font-semibold text-gray-900">New Member</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="member-name"
                className="block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <input
                id="member-name"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                placeholder="Full name"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="member-email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="member-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
                placeholder="email@example.com"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="member-role"
                className="block text-sm font-medium text-gray-700"
              >
                Role
              </label>
              <select
                id="member-role"
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as User["role"])}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Admin">Admin</option>
                <option value="Agent">Agent</option>
                <option value="Customer">Customer</option>
              </select>
            </div>
          </div>

          {createMutation.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Failed to create member. Please try again.
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                createMutation.isPending ||
                !formName.trim() ||
                !formEmail.trim()
              }
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Members" value={users.length} />
        <StatCard
          label="Admins"
          value={roleCounts["Admin"] ?? 0}
          accent="text-purple-600"
        />
        <StatCard
          label="Agents"
          value={roleCounts["Agent"] ?? 0}
          accent="text-blue-600"
        />
        <StatCard
          label="Customers"
          value={roleCounts["Customer"] ?? 0}
          accent="text-green-600"
        />
      </div>

      {/* Role Filter Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {roleFilterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setRoleFilter(tab.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              roleFilter === tab.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.value !== "all" && (
              <span className="ml-1.5 text-xs text-gray-400">
                {roleCounts[tab.value] ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-500">No members found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tickets
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const isSelected = selectedUserId === user.user_id;
                const ticketCount =
                  ticketCountsByAssignee[user.user_id] ?? 0;

                return (
                  <UserRow
                    key={user.user_id}
                    user={user}
                    ticketCount={ticketCount}
                    isSelected={isSelected}
                    onToggle={() =>
                      setSelectedUserId(isSelected ? null : user.user_id)
                    }
                    assigneeTickets={isSelected ? assigneeTickets : []}
                    isLoadingTickets={
                      isSelected && assigneeTicketsQuery.isLoading
                    }
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  ticketCount,
  isSelected,
  onToggle,
  assigneeTickets,
  isLoadingTickets,
}: {
  user: User;
  ticketCount: number;
  isSelected: boolean;
  onToggle: () => void;
  assigneeTickets: Ticket[];
  isLoadingTickets: boolean;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer transition-colors ${
          isSelected ? "bg-indigo-50" : "hover:bg-gray-50"
        }`}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-900">
              {user.name}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[user.role]}`}
          >
            {user.role}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">{ticketCount}</td>
      </tr>

      {/* Expanded detail */}
      {isSelected && (
        <tr>
          <td colSpan={4} className="bg-indigo-50 px-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">
                  Email:{" "}
                  <span className="font-medium text-gray-700">
                    {user.email}
                  </span>
                </span>
                <span className="text-gray-500">
                  Role:{" "}
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[user.role]}`}
                  >
                    {user.role}
                  </span>
                </span>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Assigned Tickets
                </h4>
                {isLoadingTickets ? (
                  <div className="mt-2 space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-8 animate-pulse rounded bg-white/60"
                      />
                    ))}
                  </div>
                ) : assigneeTickets.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-400">
                    No tickets assigned
                  </p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {assigneeTickets.map((t) => (
                      <Link
                        key={t.ticket_id}
                        to={`/tickets/${t.ticket_id}`}
                        className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900">
                          {t.subject}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[t.status]}`}
                          >
                            {t.status === "InProgress"
                              ? "In Progress"
                              : t.status}
                          </span>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[t.priority]}`}
                          >
                            {t.priority}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
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

function TeamSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
          />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-4">
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-12 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

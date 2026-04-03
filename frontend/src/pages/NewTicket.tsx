import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getUserAgentsOptions,
  getUserAllUsersOptions,
  getLabelAllLabelsOptions,
  postTicketOpenTicketMutation,
} from "../client/@tanstack/react-query.gen";
import type { Ticket } from "../client/types.gen";

export default function NewTicket() {
  const navigate = useNavigate();

  const agentsQuery = useQuery(getUserAgentsOptions());
  const usersQuery = useQuery(getUserAllUsersOptions());
  const labelsQuery = useQuery(getLabelAllLabelsOptions());

  const agents = agentsQuery.data?.data ?? [];
  const users = usersQuery.data?.data ?? [];
  const labels = labelsQuery.data?.data ?? [];

  // Form state
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Ticket["priority"]>("Medium");
  const [reporterId, setReporterId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [labelId, setLabelId] = useState("");

  // Set defaults once data loads
  useEffect(() => {
    if (!reporterId && users.length > 0) {
      const customer = users.find((u) => u.role === "Customer") ?? users[0];
      setReporterId(customer.user_id);
    }
  }, [users, reporterId]);

  useEffect(() => {
    if (!assigneeId && agents.length > 0) {
      setAssigneeId(agents[0].user_id);
    }
  }, [agents, assigneeId]);

  useEffect(() => {
    if (!labelId && labels.length > 0) {
      setLabelId(labels[0].label_id);
    }
  }, [labels, labelId]);

  const createMutation = useMutation({
    ...postTicketOpenTicketMutation(),
    onSuccess: (data) => {
      navigate(`/tickets/${data.data.ticket_id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    createMutation.mutate({
      body: {
        subject: subject.trim(),
        description: description.trim(),
        priority,
        status: "Open",
        reporter_id: reporterId,
        assignee_id: assigneeId,
        label_id: labelId,
      },
    });
  };

  const isLoading =
    agentsQuery.isLoading || usersQuery.isLoading || labelsQuery.isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Ticket</h1>
        <p className="mt-1 text-sm text-gray-500">
          Open a new support request
        </p>
      </div>

      {isLoading ? (
        <FormSkeleton />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-2xl space-y-6 rounded-xl border border-gray-200 bg-white p-6"
        >
          {/* Subject */}
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700"
            >
              Subject
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="Brief summary of the issue"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
              placeholder="Detailed description of the issue..."
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-gray-700"
              >
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as Ticket["priority"])
                }
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            {/* Label */}
            <div>
              <label
                htmlFor="label"
                className="block text-sm font-medium text-gray-700"
              >
                Label
              </label>
              <select
                id="label"
                value={labelId}
                onChange={(e) => setLabelId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                {labels.map((l) => (
                  <option key={l.label_id} value={l.label_id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Reporter */}
            <div>
              <label
                htmlFor="reporter"
                className="block text-sm font-medium text-gray-700"
              >
                Reporter
              </label>
              <select
                id="reporter"
                value={reporterId}
                onChange={(e) => setReporterId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                {users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label
                htmlFor="assignee"
                className="block text-sm font-medium text-gray-700"
              >
                Assignee
              </label>
              <select
                id="assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                {agents.map((a) => (
                  <option key={a.user_id} value={a.user_id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {createMutation.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Failed to create ticket. Please try again.
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => navigate("/tickets")}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                createMutation.isPending ||
                !subject.trim() ||
                !description.trim()
              }
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? "Creating..." : "Create Ticket"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-xl border border-gray-200 bg-white p-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-10 animate-pulse rounded-lg bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

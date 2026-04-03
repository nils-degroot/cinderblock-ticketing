import { Routes, Route, Navigate, Link } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import TicketList from "./pages/TicketList";
import TicketDetail from "./pages/TicketDetail";
import NewTicket from "./pages/NewTicket";
import TeamManagement from "./pages/TeamManagement";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tickets" element={<TicketList />} />
        <Route path="tickets/new" element={<NewTicket />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="team" element={<TeamManagement />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <p className="text-6xl font-bold text-gray-200">404</p>
      <p className="mt-4 text-sm text-gray-500">Page not found</p>
      <Link
        to="/dashboard"
        className="mt-6 text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}

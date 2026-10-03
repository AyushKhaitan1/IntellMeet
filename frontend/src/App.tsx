import MeetingSummaryPage from "./pages/MeetingSummary";
import MeetingRoom from "./pages/MeetingRoom";
import TeamBoard from "./pages/TeamBoard";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/meeting/:roomId" element={<MeetingRoom />} />
        <Route path="/meeting/:roomId/summary" element={<MeetingSummaryPage />} />
        <Route path="/team" element={<TeamBoard />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;
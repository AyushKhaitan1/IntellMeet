import { Outlet, useNavigate, Link } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function Layout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="flex justify-between items-center px-6 py-4 bg-white border-b">
        <div className="flex items-center gap-6">
          <h1 className="font-bold text-lg">IntellMeet</h1>
          <Link to="/dashboard" className="text-sm text-gray-600 hover:text-black">
            Meetings
          </Link>
          <Link to="/team" className="text-sm text-gray-600 hover:text-black">
            Team Board
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">
            Log out
          </button>
        </div>
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
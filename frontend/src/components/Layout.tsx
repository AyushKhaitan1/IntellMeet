import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function Layout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-base shadow-sm">
                🤖
              </span>
              <span>IntellMeet</span>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive("/dashboard")
                    ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                Meetings Hub
              </Link>
              <Link
                to="/team"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive("/team")
                    ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                Team Workspace
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold uppercase">
                {user?.name ? user.name.charAt(0) : "U"}
              </div>
              <span className="text-xs font-medium text-slate-200">
                {user?.name || "Team Member"}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 transition"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 pb-12">
        <Outlet />
      </main>
    </div>
  );
}
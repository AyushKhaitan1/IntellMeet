import { useState, type FormEvent } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Input from "../components/Input";
import { loginUser } from "../api/auth";
import useAuthStore from "../store/authStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginUser({ email, password });
      const token = res.data.data?.accessToken || res.data.accessToken || res.data.token;
      const user = res.data.data?.user || res.data.user || res.data;

      login(
        {
          _id: user._id || user.id,
          name: user.name || "User",
          email: user.email,
        },
        token
      );

      navigate("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.code === "ERR_NETWORK") {
          setError("Server not reachable yet — backend isn't running.");
        } else {
          setError(err.response?.data?.message || "Login failed");
        }
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail("demo@intellmeet.com");
    setPassword("Password@123");
    setError("");
    setLoading(true);

    try {
      const res = await loginUser({ email: "demo@intellmeet.com", password: "Password@123" });
      const token = res.data.data?.accessToken || res.data.accessToken || res.data.token;
      const user = res.data.data?.user || res.data.user || res.data;

      login(
        {
          _id: user._id || user.id,
          name: user.name || "Alex Morgan",
          email: user.email || "demo@intellmeet.com",
        },
        token
      );

      navigate("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Demo login failed");
      } else {
        setError("Demo login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
            🤖
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">IntellMeet</h1>
            <p className="text-xs text-slate-500 font-medium">Enterprise Meeting & Collaboration</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-2">Welcome Back</h2>
        <p className="text-sm text-slate-500 mb-6">Sign in to access your meetings, workspaces, and AI insights.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* 1-Click Quick Demo Login Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full mb-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-2.5 px-4 rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-violet-700 transition shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
        >
          <span>⚡</span>
          <span>{loading ? "Signing in..." : "Instant Demo Login (Evaluator Mode)"}</span>
        </button>

        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-xs text-slate-400 uppercase font-medium">Or enter credentials</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={setEmail}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-slate-800 transition disabled:opacity-50 mt-2"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-6 text-center">
          Don't have an account?{" "}
          <Link to="/signup" className="text-indigo-600 font-semibold hover:underline">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
}
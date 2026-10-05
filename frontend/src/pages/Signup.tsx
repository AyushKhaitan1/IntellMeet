import { useState, type FormEvent } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Input from "../components/Input";
import { signupUser } from "../api/auth";
import useAuthStore from "../store/authStore";

export default function Signup() {
  const [name, setName] = useState("");
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
      const res = await signupUser({ name, email, password });
      const token = res.data.data?.accessToken || res.data.accessToken || res.data.token;
      const user = res.data.data?.user || res.data.user || res.data;

      login(
        {
          _id: user._id || user.id,
          name: user.name || name,
          email: user.email || email,
        },
        token
      );

      navigate("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.code === "ERR_NETWORK") {
          setError("Server not reachable yet — backend isn't running.");
        } else {
          setError(err.response?.data?.message || "Signup failed");
        }
      } else {
        setError("Something went wrong");
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

        <h2 className="text-xl font-bold text-slate-800 mb-2">Create Your Account</h2>
        <p className="text-sm text-slate-500 mb-6">Join your team on IntellMeet to start collaborating.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={name} onChange={setName} />
          <Input label="Email Address" type="email" value={email} onChange={setEmail} />
          <Input label="Password" type="password" value={password} onChange={setPassword} />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-slate-800 transition disabled:opacity-50 mt-2"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-6 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
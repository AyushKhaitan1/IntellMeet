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

      const { user, accessToken } = res.data.data;

      login(
        {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
        accessToken
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-96"
      >
        <h1 className="text-2xl font-bold mb-6">Welcome Back</h1>

        {error && (
          <p className="text-red-500 text-sm mb-4">
            {error}
          </p>
        )}

        <Input
          label="Email"
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
          className="w-full bg-blue-600 text-white py-2 rounded-lg mt-4 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-600">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
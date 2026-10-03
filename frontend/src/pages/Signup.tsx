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
      login(
        { _id: res.data._id, name: res.data.name, email: res.data.email },
        res.data.token
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Create Account</h1>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <Input label="Name" value={name} onChange={setName} />
        <Input label="Email" type="email" value={email} onChange={setEmail} />
        <Input label="Password" type="password" value={password} onChange={setPassword} />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg mt-4 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Already have an account? <Link to="/login" className="text-blue-600">Log in</Link>
        </p>
      </form>
    </div>
  );
}
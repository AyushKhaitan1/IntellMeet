import api from "./axios";

interface SignupData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const signupUser = (data: SignupData) => api.post("/api/auth/signup", data);
export const loginUser = (data: LoginData) => api.post("/api/auth/login", data);
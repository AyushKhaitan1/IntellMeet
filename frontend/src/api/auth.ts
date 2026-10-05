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

export const signupUser = (data: SignupData) =>
  api.post("/api/v1/auth/register", data);

export const loginUser = (data: LoginData) =>
  api.post("/api/v1/auth/login", data);
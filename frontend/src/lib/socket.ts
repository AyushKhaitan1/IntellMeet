import { io, Socket } from "socket.io-client";
import useAuthStore from "../store/authStore";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token = useAuthStore.getState().token;
    socket = io(import.meta.env.VITE_API_URL, {
      auth: { token },
    });
  }
  return socket;
};
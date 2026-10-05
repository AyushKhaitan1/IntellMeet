import { io, Socket } from "socket.io-client";
import useAuthStore from "../store/authStore";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  const token = useAuthStore.getState().token;

  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL, {
      auth: { token },
      autoConnect: true,
    });
  } else if (!socket.connected) {
    socket.auth = { token };
    socket.connect();
  }

  return socket;
};
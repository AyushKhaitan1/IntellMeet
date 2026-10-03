import api from "./axios";

export interface Meeting {
  _id: string;
  title: string;
  status: "scheduled" | "live" | "ended";
  roomId: string;
}

export const getMeetings = async (): Promise<Meeting[]> => {
  const res = await api.get("/api/meetings");
  return res.data;
};

export const createMeeting = async (title: string): Promise<Meeting> => {
  const res = await api.post("/api/meetings", { title });
  return res.data;
};
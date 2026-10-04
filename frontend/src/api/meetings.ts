import api from "./axios";

export interface Meeting {
  _id: string;
  title: string;
  description?: string;
  status: "scheduled" | "live" | "ended";
  meetingCode?: string;
  roomId?: string;
}

export const getMeetings = async (): Promise<Meeting[]> => {
  const res = await api.get("/api/v1/meetings");
  return res.data.data;
};

export const createMeeting = async (title: string): Promise<Meeting> => {
  const res = await api.post("/api/v1/meetings", { title });
  return res.data.data;
};
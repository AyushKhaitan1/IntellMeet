import api from "./axios";

export interface ActionItem {
  task: string;
  owner: string;
}

export interface MeetingSummary {
  summary: string;
  actionItems: ActionItem[];
}

export const getMeetingSummary = async (
  roomId: string
): Promise<MeetingSummary | null> => {
  const res = await api.get(`/api/meetings/${roomId}/summary`);
  return res.data;
};
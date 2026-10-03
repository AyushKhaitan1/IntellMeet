import api from "./axios";

export interface Workspace {
  _id: string;
  name: string;
  description?: string;
}

export const getWorkspaces = async (): Promise<Workspace[]> => {
  const res = await api.get("/api/v1/workspaces");

  return res.data.data;
};
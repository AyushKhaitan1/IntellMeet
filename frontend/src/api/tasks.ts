import api from "./axios";

export type TaskStatus = "todo" | "in-progress" | "done";

export interface Task {
  _id: string;
  title: string;
  status: TaskStatus;
  assignee: string;
}

export const getTasks = async (): Promise<Task[]> => {
  const res = await api.get("/api/tasks");
  return res.data;
};

export const createTask = async (title: string): Promise<Task> => {
  const res = await api.post("/api/tasks", { title, status: "todo" });
  return res.data;
};

export const updateTaskStatus = async (
  id: string,
  status: TaskStatus
): Promise<Task> => {
  const res = await api.patch(`/api/tasks/${id}`, { status });
  return res.data;
};
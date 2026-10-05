import api from "./axios";

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "in_review"
  | "done";

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: "low" | "medium" | "high" | "urgent";
  assignee?: string;
  workspace?: string;
  dueDate?: string;
  tags?: string[];
}

interface TasksByStatus {
  todo: Task[];
  in_progress: Task[];
  in_review: Task[];
  done: Task[];
}

export const getTasks = async (
  workspaceId: string
): Promise<Task[]> => {
  const res = await api.get(
    `/api/v1/tasks/workspace/${workspaceId}`
  );

  const tasksByStatus = res.data.data as TasksByStatus;

  return [
    ...tasksByStatus.todo,
    ...tasksByStatus.in_progress,
    ...tasksByStatus.in_review,
    ...tasksByStatus.done,
  ];
};

export const createTask = async (
  title: string,
  workspaceId: string
): Promise<Task> => {
  const res = await api.post("/api/v1/tasks", {
    title,
    workspace: workspaceId,
    status: "todo",
    priority: "medium",
  });

  return res.data.data;
};

export const updateTaskStatus = async (
  id: string,
  status: TaskStatus
): Promise<Task> => {
  const res = await api.patch(
    `/api/v1/tasks/${id}/move`,
    {
      status,
    }
  );

  return res.data.data;
};
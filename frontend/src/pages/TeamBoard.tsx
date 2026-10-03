import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getTasks,
  createTask,
  updateTaskStatus,
  type Task,
  type TaskStatus,
} from "../api/tasks";

import { getWorkspaces } from "../api/workspaces";

const COLUMNS: {
  key: TaskStatus;
  label: string;
}[] = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "in_review", label: "In Review" },
  { key: "done", label: "Done" },
];

export default function TeamBoard() {
  const [title, setTitle] = useState("");

  const queryClient = useQueryClient();

  /*
   * Get the user's workspaces first.
   */
  const {
    data: workspaces,
    isLoading: workspacesLoading,
    isError: workspacesError,
  } = useQuery({
    queryKey: ["workspaces"],
    queryFn: getWorkspaces,
  });

  /*
   * Use the first workspace returned by the backend.
   *
   * We are NOT hard-coding a workspace ID.
   */
  const workspaceId = workspaces?.[0]?._id;

  /*
   * Load tasks for the real workspace.
   */
  const {
    data: tasks,
    isLoading: tasksLoading,
    isError: tasksError,
  } = useQuery({
    queryKey: ["tasks", workspaceId],
    queryFn: () => getTasks(workspaceId!),
    enabled: Boolean(workspaceId),
  });

  /*
   * Create task.
   */
  const createMutation = useMutation({
    mutationFn: (taskTitle: string) =>
      createTask(taskTitle, workspaceId!),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tasks", workspaceId],
      });

      setTitle("");
    },
  });

  /*
   * Move task.
   */
  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: TaskStatus;
    }) => updateTaskStatus(id, status),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tasks", workspaceId],
      });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !workspaceId) {
      return;
    }

    createMutation.mutate(title.trim());
  };

  const tasksByStatus = (
    status: TaskStatus
  ): Task[] =>
    tasks?.filter(
      (task) => task.status === status
    ) ?? [];

  if (workspacesLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p>Loading workspace...</p>
      </div>
    );
  }

  if (workspacesError) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-red-500">
          Could not load your workspace.
        </p>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">
          Team Workspace
        </h1>

        <p className="text-gray-500">
          No workspace is available for your account yet.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Team Workspace
      </h1>

      <form
        onSubmit={handleCreate}
        className="flex gap-2 mb-6"
      >
        <input
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          placeholder="New task title"
          className="flex-1 border rounded-lg px-3 py-2"
        />

        <button
          type="submit"
          disabled={
            createMutation.isPending ||
            !title.trim()
          }
          className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {createMutation.isPending
            ? "Adding..."
            : "Add Task"}
        </button>
      </form>

      {tasksLoading && (
        <p>Loading tasks...</p>
      )}

      {tasksError && (
        <p className="text-red-500">
          Could not load tasks.
        </p>
      )}

      {!tasksLoading && !tasksError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((column) => (
            <div
              key={column.key}
              className="bg-gray-100 rounded-lg p-3"
            >
              <h2 className="font-semibold text-sm mb-3">
                {column.label} (
                {tasksByStatus(column.key).length}
                )
              </h2>

              <div className="space-y-2">
                {tasksByStatus(
                  column.key
                ).map((task) => (
                  <div
                    key={task._id}
                    className="bg-white rounded-lg p-3 shadow-sm"
                  >
                    <p className="text-sm font-medium mb-2">
                      {task.title}
                    </p>

                    {task.assignee && (
                      <p className="text-xs text-gray-500 mb-2">
                        {task.assignee}
                      </p>
                    )}

                    <select
                      value={task.status}
                      onChange={(e) =>
                        statusMutation.mutate({
                          id: task._id,
                          status:
                            e.target.value as TaskStatus,
                        })
                      }
                      disabled={
                        statusMutation.isPending
                      }
                      className="text-xs border rounded px-2 py-1 w-full"
                    >
                      {COLUMNS.map(
                        (columnOption) => (
                          <option
                            key={
                              columnOption.key
                            }
                            value={
                              columnOption.key
                            }
                          >
                            {columnOption.label}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
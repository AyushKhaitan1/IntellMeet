import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasks, createTask, updateTaskStatus, type Task, type TaskStatus } from "../api/tasks";

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "in-progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

export default function TeamBoard() {
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();

  const { data: tasks, isLoading, isError } = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setTitle("");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate(title);
  };

  const tasksByStatus = (status: TaskStatus): Task[] =>
    tasks?.filter((task) => task.status === status) ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Team Workspace</h1>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task title"
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {createMutation.isPending ? "Adding..." : "Add Task"}
        </button>
      </form>

      {isLoading && <p>Loading tasks...</p>}
      {isError && (
        <p className="text-red-500">
          Could not load tasks. The server may not be running yet.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((column) => (
            <div key={column.key} className="bg-gray-100 rounded-lg p-3">
              <h2 className="font-semibold text-sm mb-3">
                {column.label} ({tasksByStatus(column.key).length})
              </h2>
              <div className="space-y-2">
                {tasksByStatus(column.key).map((task) => (
                  <div key={task._id} className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-sm font-medium mb-2">{task.title}</p>
                    <p className="text-xs text-gray-500 mb-2">{task.assignee}</p>
                    <select
                      value={task.status}
                      onChange={(e) =>
                        statusMutation.mutate({
                          id: task._id,
                          status: e.target.value as TaskStatus,
                        })
                      }
                      className="text-xs border rounded px-2 py-1 w-full"
                    >
                      {COLUMNS.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
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
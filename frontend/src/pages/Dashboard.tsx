import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getMeetings, createMeeting } from "../api/meetings";

export default function Dashboard() {
  const [title, setTitle] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: meetings, isLoading, isError } = useQuery({
    queryKey: ["meetings"],
    queryFn: getMeetings,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setTitle("");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    mutate(title);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Meetings</h1>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Meeting title"
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create"}
        </button>
      </form>

      {isLoading && <p>Loading meetings...</p>}
      {isError && (
        <p className="text-red-500">
          Could not load meetings. The server may not be running yet.
        </p>
      )}

      <ul className="space-y-2">
        {meetings?.map((meeting) => (
          <li
            key={meeting._id}
            onClick={() =>
              navigate(
                meeting.status === "ended"
                  ? `/meeting/${meeting._id}/summary`
                  : `/meeting/${meeting._id}`
              )
            }
            className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 bg-white"
          >
            <p className="font-medium">{meeting.title}</p>
            <p className="text-sm text-gray-500">Status: {meeting.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
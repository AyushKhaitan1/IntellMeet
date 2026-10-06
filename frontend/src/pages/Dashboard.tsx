import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getMeetings, createMeeting, type Meeting } from "../api/meetings";

function formatTo12Hour(time24: string): string {
  const [hoursStr, minutes] = time24.split(":");
  let hours = parseInt(hoursStr, 10);
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${period}`;
}

export default function Dashboard() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: rawMeetings, isLoading, isError } = useQuery({
    queryKey: ["meetings"],
    queryFn: getMeetings,
  });

  const meetings: Meeting[] = Array.isArray(rawMeetings)
    ? rawMeetings
    : (rawMeetings as any)?.data || [];

  const { mutate, isPending } = useMutation({
    mutationFn: (vars: { title: string; date: string; startTime: string; endTime: string }) =>
      createMeeting(vars.title, vars.date, vars.startTime, vars.endTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setTitle("");
      setDate("");
      setStartTime("");
      setEndTime("");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !startTime || !endTime) return;
    mutate({ title, date, startTime, endTime });
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    navigate(`/meeting/${joinCode.trim().toUpperCase()}`);
  };

  const liveMeetingsCount = meetings.filter((m) => m.status === "live").length;
  const completedMeetingsCount = meetings.filter((m) => m.status === "ended").length;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header & Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Collaboration Hub</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time video conferencing, AI executive summaries, and active workspaces.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Backend API Connected
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-bold">
            🟢
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Meetings</p>
            <p className="text-2xl font-black text-slate-800">{liveMeetingsCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl font-bold">
            📅
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Hosted</p>
            <p className="text-2xl font-black text-slate-800">{meetings.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl font-bold">
            🧠
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Summaries</p>
            <p className="text-2xl font-black text-slate-800">{completedMeetingsCount}</p>
          </div>
        </div>
      </div>

      {/* Action Boxes: Create or Join */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Meeting */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
              <span>🚀</span> Schedule a New Meeting
            </h2>
            <p className="text-xs text-indigo-200 mb-5">
              Pick a title, date, and time window for your conference.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Sprint Planning & Architecture"
              className="w-full bg-indigo-950/60 border border-indigo-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-indigo-300/60 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-indigo-950/60 border border-indigo-700/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            <div className="flex gap-3">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-1/2 bg-indigo-950/60 border border-indigo-700/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-1/2 bg-indigo-950/60 border border-indigo-700/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {startTime && endTime && (
              <p className="text-xs text-indigo-200">
                Scheduled: {formatTo12Hour(startTime)} – {formatTo12Hour(endTime)}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition shadow-lg shadow-indigo-900/50 disabled:opacity-50"
            >
              {isPending ? "Scheduling..." : "Schedule Meeting"}
            </button>
          </form>
        </div>

        {/* Join by Code */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <span>🔑</span> Join Existing Meeting
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Enter a 9-digit meeting code or ID provided by the host.
            </p>
          </div>

          <form onSubmit={handleJoinByCode} className="space-y-3">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="e.g. IM-LIVE-901 or 3X3-YYY-ZZZ"
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition shadow-sm"
            >
              Join Room Now
            </button>
          </form>
        </div>
      </div>

      {/* Meeting List Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Your Meetings & History</h2>

        {isLoading && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <p className="text-slate-500 text-sm animate-pulse">Loading active meetings and historical records...</p>
          </div>
        )}

        {isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            Could not retrieve meetings from the backend. Ensure the server is running on port 5000.
          </div>
        )}

        {!isLoading && meetings.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
            <p className="text-slate-600 font-medium">No meetings created yet.</p>
            <p className="text-xs text-slate-400 mt-1">Use the form above to start your first session.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.map((meeting) => {
            const isLive = meeting.status === "live";
            const isEnded = meeting.status === "ended";
            const roomId = (meeting as any).roomId || meeting.meetingCode || meeting._id;

            return (
              <div
                key={meeting._id}
                onClick={() =>
                  navigate(
                    isEnded
                      ? `/meeting/${roomId}/summary`
                      : `/meeting/${roomId}`
                  )
                }
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isLive
                          ? "bg-red-50 text-red-600 border border-red-200 animate-pulse"
                          : isEnded
                          ? "bg-slate-100 text-slate-600"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {isLive ? "● LIVE" : isEnded ? "Concluded" : "Scheduled"}
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-400">
                      Code: {roomId}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{meeting.title}</h3>

                  {meeting.date && meeting.startTime && meeting.endTime ? (
                    <p className="text-xs text-indigo-600 font-semibold mt-1">
                      {meeting.date} · {formatTo12Hour(meeting.startTime)} - {formatTo12Hour(meeting.endTime)}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {meeting.description || "Enterprise session with real-time video, notes, and transcription."}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-slate-500">
                  <span>{isEnded ? "View AI Summary & Notes →" : "Enter Video Room →"}</span>
                  <span className="font-semibold text-indigo-600">
                    {isEnded ? "Report Ready" : "Join"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
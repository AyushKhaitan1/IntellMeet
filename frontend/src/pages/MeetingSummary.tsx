import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getMeetingSummary, type MeetingSummary as Summary } from "../api/summary";

export default function MeetingSummaryPage() {
  const { roomId } = useParams();
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    setErrorMsg("");
    getMeetingSummary(roomId)
      .then((result) => {
        const payload = (result as any)?.data || result;
        setData(payload);
      })
      .catch(() => setErrorMsg("Could not reach the server. It may not be running yet."))
      .finally(() => setLoading(false));
  }, [roomId]);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <Link to="/dashboard" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          ← Back to Meetings Dashboard
        </Link>
        <span className="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1 rounded-full border">
          Session ID: {roomId}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>🧠</span> AI Meeting Intelligence Report
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated transcription synthesis, decisions, and smart action item extraction.
          </p>
        </div>
      </div>

      {loading && (
        <div className="bg-white p-12 rounded-2xl border text-center">
          <p className="text-sm text-slate-500 animate-pulse font-medium">Generating executive summary from meeting audio...</p>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      {!loading && !data && !errorMsg && (
        <div className="bg-white p-12 rounded-2xl border border-dashed text-center">
          <p className="text-slate-600 font-semibold">No summary available yet for this meeting.</p>
          <p className="text-xs text-slate-400 mt-1">Summaries are automatically extracted upon meeting completion.</p>
        </div>
      )}

      {!loading && data && (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📝</span>
              <h2 className="font-bold text-slate-900 text-lg">Executive Summary</h2>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
              {data.summary || "No summary overview generated."}
            </p>
          </div>

          {/* Action Items Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <h2 className="font-bold text-slate-900 text-lg">Extracted Action Items</h2>
              </div>
              <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                {data.actionItems?.length || 0} Action Items
              </span>
            </div>

            {(!data.actionItems || data.actionItems.length === 0) ? (
              <p className="text-xs text-slate-400 italic">No explicit action items detected in this discussion.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.actionItems.map((item, i) => (
                  <li key={i} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-800">{item.task}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium">
                        Assignee: <strong className="text-slate-900">{item.owner}</strong>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
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
      .then((result) => setData(result))
      .catch(() => setErrorMsg("Could not reach the server. It may not be running yet."))
      .finally(() => setLoading(false));
  }, [roomId]);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link to="/dashboard" className="text-sm text-blue-600">
        ← Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-6">Meeting Summary</h1>

      {loading && <p>Generating summary...</p>}

      {errorMsg && <p className="text-red-500">{errorMsg}</p>}

      {!loading && !data && !errorMsg && (
        <p className="text-gray-500">
          No summary available yet for this meeting.
        </p>
      )}

      {!loading && data && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Summary</h2>
            <p className="text-gray-700 text-sm">{data.summary}</p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-3">Action Items</h2>
            <ul className="space-y-2">
              {data.actionItems.map((item, i) => (
                <li key={i} className="text-sm flex justify-between border-b pb-2">
                  <span>{item.task}</span>
                  <span className="text-gray-500">{item.owner}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
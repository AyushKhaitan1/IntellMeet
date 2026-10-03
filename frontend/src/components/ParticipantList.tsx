import { useEffect, useState } from "react";
import { getSocket } from "../lib/socket";

interface Participant {
  socketId: string;
  name: string;
}

export default function ParticipantList() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const socket = getSocket();

  useEffect(() => {
    const handleExisting = (peers: { socketId: string; user: { name: string } }[]) => {
      setParticipants(peers.map((p) => ({ socketId: p.socketId, name: p.user.name })));
    };

    const handleJoined = (peer: { socketId: string; user: { name: string } }) => {
      setParticipants((prev) => [...prev, { socketId: peer.socketId, name: peer.user.name }]);
    };

    const handleLeft = ({ socketId }: { socketId: string }) => {
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
    };

    socket.on("existing-peers", handleExisting);
    socket.on("peer-joined", handleJoined);
    socket.on("peer-left", handleLeft);

    return () => {
      socket.off("existing-peers", handleExisting);
      socket.off("peer-joined", handleJoined);
      socket.off("peer-left", handleLeft);
    };
  }, [socket]);

  return (
    <div className="border rounded-lg p-4 bg-white w-full max-w-xs">
      <h2 className="font-semibold text-sm mb-3">
        Participants ({participants.length + 1})
      </h2>
      <ul className="space-y-2 text-sm">
        <li className="text-gray-700">You</li>
        {participants.map((p) => (
          <li key={p.socketId} className="text-gray-700">
            {p.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
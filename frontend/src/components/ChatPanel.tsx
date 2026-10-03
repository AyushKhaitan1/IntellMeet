import { useEffect, useState, type FormEvent } from "react";
import { getSocket } from "../lib/socket";

interface ChatMessage {
  id: string;
  senderName: string;
  text: string;
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const socket = getSocket();

  useEffect(() => {
    const handleMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };
    socket.on("chat:message", handleMessage);
    return () => {
      socket.off("chat:message", handleMessage);
    };
  }, [socket]);

  const sendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    socket.emit("chat:send", { text }, (res: { error?: string }) => {
      if (res?.error) console.error(res.error);
    });
    setText("");
  };

  return (
    <div className="border rounded-lg p-4 flex flex-col h-96 w-full max-w-sm bg-white">
      <div className="flex-1 overflow-y-auto space-y-2 mb-2">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400">No messages yet.</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            <span className="font-semibold">{msg.senderName}: </span>
            {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border rounded-lg px-2 py-1 text-sm"
          placeholder="Type a message..."
        />
        <button type="submit" className="bg-blue-600 text-white px-3 rounded-lg text-sm">
          Send
        </button>
      </form>
    </div>
  );
}
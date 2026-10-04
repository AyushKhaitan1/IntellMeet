import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getSocket } from "../lib/socket";
import { PeerManager } from "../lib/PeerManager";
import ChatPanel from "../components/ChatPanel";
import ParticipantList from "../components/ParticipantList";

interface RemotePeer {
  socketId: string;
  stream: MediaStream;
}

export default function MeetingRoom() {
  const { id } = useParams();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerManagerRef = useRef<PeerManager | null>(null);

  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connecting...");
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);

  useEffect(() => {
    const socket = getSocket();

    const addOrUpdateRemote = (socketId: string, stream: MediaStream) => {
      setRemotePeers((prev) => {
        const exists = prev.find((p) => p.socketId === socketId);
        if (exists) {
          return prev.map((p) => (p.socketId === socketId ? { ...p, stream } : p));
        }
        return [...prev, { socketId, stream }];
      });
    };

    const removeRemote = (socketId: string) => {
      setRemotePeers((prev) => prev.filter((p) => p.socketId !== socketId));
    };

    const setup = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        peerManagerRef.current = new PeerManager(socket, stream, addOrUpdateRemote);

        socket.on("existing-peers", (peers: { socketId: string }[]) => {
          peers.forEach((peer) => peerManagerRef.current?.callPeer(peer.socketId));
        });

        socket.on("signal", (payload) => {
          peerManagerRef.current?.handleSignal(payload);
        });

        socket.on("peer-left", ({ socketId }: { socketId: string }) => {
          peerManagerRef.current?.removePeer(socketId);
          removeRemote(socketId);
        });
      } catch {
        setError("Could not access camera or microphone. Check permissions.");
      }
    };

    setup();

    socket.on("connect", () => {
      setConnectionStatus("connected to server");
      socket.emit("join-room", { id }, (res: { error?: string }) => {
        if (res?.error) setConnectionStatus(`join failed: ${res.error}`);
        else setConnectionStatus("joined room");
      });
    });

    socket.on("connect_error", () => {
      setConnectionStatus("backend not reachable yet");
    });

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerManagerRef.current?.closeAll();
      socket.off("connect");
      socket.off("connect_error");
      socket.off("existing-peers");
      socket.off("signal");
      socket.off("peer-left");
    };
  }, [id]);

  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setMicOn((prev) => !prev);
  };

  const toggleCamera = () => {
    streamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setCameraOn((prev) => !prev);
  };

  const toggleScreenShare = async () => {
    if (!sharingScreen) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setSharingScreen(true);
        screenStream.getVideoTracks()[0].onended = () => stopScreenShare();
      } catch {
        // user cancelled the picker
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    if (localVideoRef.current && streamRef.current) {
      localVideoRef.current.srcObject = streamRef.current;
    }
    setSharingScreen(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold mb-1">Meeting: {id}</h1>
      <p className="text-sm text-gray-500 mb-4">Status: {connectionStatus}</p>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="rounded-lg bg-black w-full aspect-video"
            />
            {remotePeers.map((peer) => (
              <RemoteVideo key={peer.socketId} stream={peer.stream} />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={toggleMic}
              className={`px-4 py-2 rounded-lg text-sm text-white ${micOn ? "bg-gray-700" : "bg-red-600"}`}
            >
              {micOn ? "Mute" : "Unmute"}
            </button>
            <button
              onClick={toggleCamera}
              className={`px-4 py-2 rounded-lg text-sm text-white ${cameraOn ? "bg-gray-700" : "bg-red-600"}`}
            >
              {cameraOn ? "Camera Off" : "Camera On"}
            </button>
            <button
              onClick={toggleScreenShare}
              className={`px-4 py-2 rounded-lg text-sm text-white ${sharingScreen ? "bg-blue-700" : "bg-gray-700"}`}
            >
              {sharingScreen ? "Stop Sharing" : "Share Screen"}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <ParticipantList />
          <ChatPanel />
        </div>
      </div>
    </div>
  );
}

function RemoteVideo({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      className="rounded-lg bg-black w-full aspect-video"
    />
  );
}
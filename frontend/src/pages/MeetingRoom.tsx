import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSocket } from "../lib/socket";
import { PeerManager } from "../lib/PeerManager";
import ChatPanel from "../components/ChatPanel";
import ParticipantList from "../components/ParticipantList";

interface RemotePeer {
  socketId: string;
  stream: MediaStream;
}

export default function MeetingRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();

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

    // Prevent a late getUserMedia() result from creating
    // a camera stream after the component has been cleaned up.
    let cancelled = false;

    const stopAllMedia = () => {
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;

      screenStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      screenStreamRef.current = null;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }

      setSharingScreen(false);
    };

    const addOrUpdateRemote = (
      socketId: string,
      stream: MediaStream
    ) => {
      setRemotePeers((prev) => {
        const exists = prev.find(
          (peer) => peer.socketId === socketId
        );

        if (exists) {
          return prev.map((peer) =>
            peer.socketId === socketId
              ? { ...peer, stream }
              : peer
          );
        }

        return [...prev, { socketId, stream }];
      });
    };

    const removeRemote = (socketId: string) => {
      setRemotePeers((prev) =>
        prev.filter((peer) => peer.socketId !== socketId)
      );
    };

    const handleConnect = () => {
      setConnectionStatus("connected to server");

      socket.emit(
        "join-room",
        { roomId },
        (res: { error?: string }) => {
          if (res?.error) {
            setConnectionStatus(`join failed: ${res.error}`);
          } else {
            setConnectionStatus("joined room");
          }
        }
      );
    };

    const handleConnectError = () => {
      setConnectionStatus("backend not reachable yet");
    };

    const handleExistingPeers = (
      peers: { socketId: string }[]
    ) => {
      peers.forEach((peer) => {
        peerManagerRef.current?.callPeer(peer.socketId);
      });
    };

    const handleSignal = (payload: { from: string; data: any }) => {
      peerManagerRef.current?.handleSignal(payload);
    };

    const handlePeerLeft = ({
      socketId,
    }: {
      socketId: string;
    }) => {
      peerManagerRef.current?.removePeer(socketId);
      removeRemote(socketId);
    };

    const setup = async () => {
      try {
        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

        // If the component was already cleaned up while
        // getUserMedia() was waiting, immediately stop
        // the newly-created camera/mic tracks.
        if (cancelled) {
          stream.getTracks().forEach((track) => {
            track.stop();
          });
          return;
        }

        streamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        peerManagerRef.current = new PeerManager(
          socket,
          stream,
          addOrUpdateRemote
        );

        socket.on(
          "existing-peers",
          handleExistingPeers
        );

        socket.on("signal", handleSignal);

        socket.on("peer-left", handlePeerLeft);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError(
            "Could not access camera or microphone. Check permissions."
          );
        }
      }
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);

    setup();

    // Cleanup when leaving the meeting or unmounting.
    return () => {
      cancelled = true;

      stopAllMedia();

      peerManagerRef.current?.closeAll();
      peerManagerRef.current = null;

      setRemotePeers([]);

      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off(
        "existing-peers",
        handleExistingPeers
      );
      socket.off("signal", handleSignal);
      socket.off("peer-left", handlePeerLeft);

      // Important: prevent Socket.io from reconnecting
      // after leaving the meeting.
      socket.disconnect();
    };
  }, [roomId]);

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

  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    screenStreamRef.current = null;

    if (localVideoRef.current && streamRef.current) {
      localVideoRef.current.srcObject = streamRef.current;
    }

    setSharingScreen(false);
  };

  const toggleScreenShare = async () => {
    if (!sharingScreen) {
      try {
        const screenStream =
          await navigator.mediaDevices.getDisplayMedia({
            video: true,
          });

        screenStreamRef.current = screenStream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        setSharingScreen(true);

        const screenTrack =
          screenStream.getVideoTracks()[0];

        if (screenTrack) {
          screenTrack.onended = () => {
            stopScreenShare();
          };
        }
      } catch {
        // User cancelled screen sharing.
      }
    } else {
      stopScreenShare();
    }
  };

  const leaveMeeting = () => {
    // Stop camera + microphone immediately.
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;

    // Stop screen sharing.
    screenStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    screenStreamRef.current = null;

    // Remove video element's reference to the stream.
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    // Close WebRTC connections.
    peerManagerRef.current?.closeAll();
    peerManagerRef.current = null;

    // Disconnect Socket.io.
    const socket = getSocket();
    socket.disconnect();

    // Return to dashboard.
    navigate("/dashboard");
  };

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-lg font-semibold">
            Meeting: {roomId}
          </h1>

          <p className="text-sm text-gray-500">
            Status: {connectionStatus}
          </p>
        </div>

        <button
          onClick={leaveMeeting}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700"
        >
          Leave Meeting
        </button>
      </div>

      {error && (
        <p className="text-red-500 mb-4">
          {error}
        </p>
      )}

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
              <RemoteVideo
                key={peer.socketId}
                stream={peer.stream}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={toggleMic}
              className={`px-4 py-2 rounded-lg text-sm text-white ${
                micOn ? "bg-gray-700" : "bg-red-600"
              }`}
            >
              {micOn ? "Mute" : "Unmute"}
            </button>

            <button
              onClick={toggleCamera}
              className={`px-4 py-2 rounded-lg text-sm text-white ${
                cameraOn ? "bg-gray-700" : "bg-red-600"
              }`}
            >
              {cameraOn ? "Camera Off" : "Camera On"}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`px-4 py-2 rounded-lg text-sm text-white ${
                sharingScreen
                  ? "bg-blue-700"
                  : "bg-gray-700"
              }`}
            >
              {sharingScreen
                ? "Stop Sharing"
                : "Share Screen"}
            </button>

            <button
              onClick={leaveMeeting}
              className="px-4 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-700"
            >
              Leave Meeting
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

function RemoteVideo({
  stream,
}: {
  stream: MediaStream;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }

    return () => {
      if (ref.current) {
        ref.current.srcObject = null;
      }
    };
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
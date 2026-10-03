import type { Socket } from "socket.io-client";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export class PeerManager {
  private peers = new Map<string, RTCPeerConnection>();
  private socket: Socket;
  private localStream: MediaStream;
  private onRemoteStream: (socketId: string, stream: MediaStream) => void;

  constructor(
    socket: Socket,
    localStream: MediaStream,
    onRemoteStream: (socketId: string, stream: MediaStream) => void
  ) {
    this.socket = socket;
    this.localStream = localStream;
    this.onRemoteStream = onRemoteStream;
  }

  private createPeer(socketId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    this.localStream.getTracks().forEach((track) => {
      pc.addTrack(track, this.localStream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit("signal", {
          to: socketId,
          data: { candidate: event.candidate },
        });
      }
    };

    pc.ontrack = (event) => {
      this.onRemoteStream(socketId, event.streams[0]);
    };

    this.peers.set(socketId, pc);
    return pc;
  }

  async callPeer(socketId: string) {
    const pc = this.createPeer(socketId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.socket.emit("signal", {
      to: socketId,
      data: { sdp: pc.localDescription },
    });
  }

  async handleSignal({ from, data }: { from: string; data: any }) {
    const pc = this.peers.get(from) ?? this.createPeer(from);

    if (data.sdp) {
      await pc.setRemoteDescription(data.sdp);
      if (data.sdp.type === "offer") {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.socket.emit("signal", {
          to: from,
          data: { sdp: pc.localDescription },
        });
      }
    } else if (data.candidate) {
      await pc.addIceCandidate(data.candidate);
    }
  }

  removePeer(socketId: string) {
    this.peers.get(socketId)?.close();
    this.peers.delete(socketId);
  }

  closeAll() {
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
  }
}
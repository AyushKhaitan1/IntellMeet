import { logger } from '../utils/logger.js';
import { ChatMessage } from '../models/ChatMessage.js';

export const setupSocketHandlers = (io) => {
  // Store active rooms and participants in memory
  const activeRooms = new Map(); // roomId -> Set of socketIds

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join a meeting room
    socket.on('join-room', async ({ roomId, user }) => {
      socket.join(roomId);
      socket.roomId = roomId;
      socket.user = user || { name: 'Guest User', _id: socket.id };

      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, new Set());
      }
      activeRooms.get(roomId).add(socket.id);

      logger.info(`Socket ${socket.id} (${socket.user.name}) joined meeting room: ${roomId}`);

      // Broadcast to existing room members that new user connected (WebRTC Signaling entrypoint)
      socket.to(roomId).emit('user-connected', {
        socketId: socket.id,
        user: socket.user
      });

      // Send list of currently connected participants to the new joiner
      const roomParticipants = Array.from(activeRooms.get(roomId))
        .filter((id) => id !== socket.id)
        .map((id) => {
          const s = io.sockets.sockets.get(id);
          return {
            socketId: id,
            user: s?.user || { name: 'Participant' }
          };
        });

      socket.emit('room-users', roomParticipants);
    });

    // WebRTC Signaling: Offer
    socket.on('signal-offer', ({ targetSocketId, offer }) => {
      io.to(targetSocketId).emit('signal-offer', {
        callerSocketId: socket.id,
        offer,
        user: socket.user
      });
    });

    // WebRTC Signaling: Answer
    socket.on('signal-answer', ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit('signal-answer', {
        responderSocketId: socket.id,
        answer
      });
    });

    // WebRTC Signaling: ICE Candidate
    socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('ice-candidate', {
        senderSocketId: socket.id,
        candidate
      });
    });

    // In-Meeting Real-time Chat
    socket.on('send-chat-message', async ({ roomId, message, attachments }) => {
      try {
        const chatData = {
          meeting: roomId.length === 24 ? roomId : null,
          sender: {
            user: socket.user?._id?.length === 24 ? socket.user._id : null,
            name: socket.user?.name || 'Participant',
            avatar: socket.user?.avatar?.url || ''
          },
          content: message,
          attachments: attachments || [],
          timestamp: new Date()
        };

        // Persist message if valid meeting ID
        if (chatData.meeting) {
          await ChatMessage.create(chatData);
        }

        io.to(roomId).emit('new-chat-message', {
          ...chatData,
          id: socket.id + '-' + Date.now()
        });
      } catch (err) {
        logger.error(`Error saving real-time chat: ${err.message}`);
      }
    });

    // Meeting Controls (Mute, Video, Screen Share, Hand Raise)
    socket.on('toggle-audio', ({ roomId, isMuted }) => {
      socket.to(roomId).emit('user-audio-toggled', {
        socketId: socket.id,
        isMuted
      });
    });

    socket.on('toggle-video', ({ roomId, isVideoOff }) => {
      socket.to(roomId).emit('user-video-toggled', {
        socketId: socket.id,
        isVideoOff
      });
    });

    socket.on('raise-hand', ({ roomId, isRaised }) => {
      io.to(roomId).emit('user-hand-raised', {
        socketId: socket.id,
        user: socket.user,
        isRaised
      });
    });

    socket.on('screen-share-status', ({ roomId, isSharing }) => {
      socket.to(roomId).emit('user-screen-share', {
        socketId: socket.id,
        user: socket.user,
        isSharing
      });
    });

    // AI Live Transcription Chunk broadcast (For Rishika's AI pipeline)
    socket.on('live-transcript-chunk', ({ roomId, transcriptChunk }) => {
      socket.to(roomId).emit('live-transcript-received', transcriptChunk);
    });

    // Disconnect event
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
      if (socket.roomId && activeRooms.has(socket.roomId)) {
        activeRooms.get(socket.roomId).delete(socket.id);
        if (activeRooms.get(socket.roomId).size === 0) {
          activeRooms.delete(socket.roomId);
        }
        socket.to(socket.roomId).emit('user-disconnected', {
          socketId: socket.id,
          user: socket.user
        });
      }
    });
  });
};

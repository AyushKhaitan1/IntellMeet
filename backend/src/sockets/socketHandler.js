import { logger } from '../utils/logger.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { verifyAccessToken } from '../utils/token.utils.js';
import { User } from '../models/User.js';

export const setupSocketHandlers = (io) => {
  // Socket authentication middleware to populate user
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token && token !== 'null' && token !== 'undefined') {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.id).select('name email avatar');
        if (user) {
          socket.user = {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            avatar: user.avatar
          };
        }
      }
    } catch (err) {
      logger.warn(`Socket auth token verification skipped: ${err.message}`);
    }
    next();
  });

  // Store active rooms and participants in memory: roomId -> Set of socketIds
  const activeRooms = new Map();

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join a meeting room (supports both payload formats and callback)
    socket.on('join-room', async (payload, callback) => {
      const roomId = typeof payload === 'string' ? payload : payload?.roomId || 'default-room';
      const user = payload?.user || socket.user || { name: 'Participant', _id: socket.id };

      socket.join(roomId);
      socket.roomId = roomId;
      socket.user = user;

      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, new Set());
      }
      activeRooms.get(roomId).add(socket.id);

      logger.info(`Socket ${socket.id} (${socket.user.name}) joined meeting room: ${roomId}`);

      // Broadcast to existing room members
      socket.to(roomId).emit('user-connected', {
        socketId: socket.id,
        user: socket.user
      });
      socket.to(roomId).emit('peer-joined', {
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

      // Send to new user in both formats
      socket.emit('room-users', roomParticipants);
      socket.emit('existing-peers', roomParticipants);

      // Invoke acknowledgment callback if provided
      if (typeof callback === 'function') {
        callback({ error: null, success: true });
      }
    });

    // General WebRTC Signaling Relay (for PeerManager.ts)
    socket.on('signal', ({ to, data }) => {
      if (to) {
        io.to(to).emit('signal', {
          from: socket.id,
          data
        });
      }
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

    // In-Meeting Real-time Chat (Frontend format: chat:send -> chat:message)
    socket.on('chat:send', async ({ text }, callback) => {
      try {
        const msg = {
          id: `${socket.id}-${Date.now()}`,
          senderName: socket.user?.name || 'Participant',
          text
        };

        if (socket.roomId) {
          io.to(socket.roomId).emit('chat:message', msg);

          // Persist if valid ObjectId
          if (socket.roomId.length === 24) {
            await ChatMessage.create({
              meeting: socket.roomId,
              sender: {
                user: socket.user?._id?.length === 24 ? socket.user._id : null,
                name: msg.senderName
              },
              content: text,
              timestamp: new Date()
            });
          }
        }

        if (typeof callback === 'function') {
          callback({ error: null, success: true });
        }
      } catch (err) {
        logger.error(`Error handling chat:send: ${err.message}`);
        if (typeof callback === 'function') {
          callback({ error: err.message });
        }
      }
    });

    // In-Meeting Real-time Chat (Generic format: send-chat-message -> new-chat-message)
    socket.on('send-chat-message', async ({ roomId, message, attachments }) => {
      try {
        const chatData = {
          meeting: roomId?.length === 24 ? roomId : null,
          sender: {
            user: socket.user?._id?.length === 24 ? socket.user._id : null,
            name: socket.user?.name || 'Participant',
            avatar: socket.user?.avatar?.url || ''
          },
          content: message,
          attachments: attachments || [],
          timestamp: new Date()
        };

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

    // Meeting Controls
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

    // AI Live Transcription Chunk broadcast
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
        socket.to(socket.roomId).emit('peer-left', {
          socketId: socket.id
        });
      }
    });
  });
};

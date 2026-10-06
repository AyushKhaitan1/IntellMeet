import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['host', 'co-host', 'participant'],
      default: 'participant'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: {
      type: Date
    },
    durationSeconds: {
      type: Number,
      default: 0
    }
  },
  { _id: true }
);

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    meetingCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true
    },
    passcode: {
      type: String,
      default: ''
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    coHosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      index: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended', 'cancelled'],
      default: 'scheduled',
      index: true
    },
    date: {
      type: String,
      default: '',
      trim: true
    },
    startTime: {
      type: String,
      default: '',
      trim: true
    },
    endTime: {
      type: String,
      default: '',
      trim: true
    },
    scheduledStartTime: {
      type: Date,
      default: Date.now
    },
    scheduledEndTime: {
      type: Date
    },
    actualStartTime: {
      type: Date
    },
    actualEndTime: {
      type: Date
    },
    participants: [participantSchema],
    settings: {
      allowScreenShare: {
        type: Boolean,
        default: true
      },
      muteOnEntry: {
        type: Boolean,
        default: false
      },
      chatEnabled: {
        type: Boolean,
        default: true
      },
      waitingRoom: {
        type: Boolean,
        default: false
      },
      aiRecordingEnabled: {
        type: Boolean,
        default: true
      }
    },
    recordingUrl: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster lookups
meetingSchema.index({ host: 1, createdAt: -1 });
meetingSchema.index({ workspace: 1, status: 1 });

export const Meeting = mongoose.model('Meeting', meetingSchema);

import mongoose from 'mongoose';

const transcriptEntrySchema = new mongoose.Schema(
  {
    speaker: {
      type: String,
      required: true
    },
    speakerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: String,
      default: '00:00'
    },
    text: {
      type: String,
      required: true
    }
  },
  { _id: true }
);

const actionItemSchema = new mongoose.Schema(
  {
    taskTitle: {
      type: String,
      required: true
    },
    assigneeName: {
      type: String,
      default: 'Unassigned'
    },
    assigneeUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: {
      type: Date
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    completed: {
      type: Boolean,
      default: false
    },
    createdTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    }
  },
  { _id: true }
);

const meetingIntelligenceSchema = new mongoose.Schema(
  {
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      unique: true,
      index: true
    },
    transcript: [transcriptEntrySchema],
    summary: {
      overview: {
        type: String,
        default: ''
      },
      keyPoints: [
        {
          type: String
        }
      ],
      decisions: [
        {
          type: String
        }
      ],
      highlights: [
        {
          type: String
        }
      ]
    },
    extractedActionItems: [actionItemSchema],
    sentiment: {
      score: {
        type: Number,
        default: 0
      },
      label: {
        type: String,
        enum: ['positive', 'neutral', 'negative'],
        default: 'neutral'
      },
      positivePercent: {
        type: Number,
        default: 50
      },
      neutralPercent: {
        type: Number,
        default: 50
      },
      negativePercent: {
        type: Number,
        default: 0
      }
    },
    aiModelUsed: {
      type: String,
      default: 'gpt-4o-mini'
    },
    audioRecordingUrl: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const MeetingIntelligence = mongoose.model('MeetingIntelligence', meetingIntelligenceSchema);

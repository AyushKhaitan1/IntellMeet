import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Meeting } from '../src/models/Meeting.js';
import { Workspace } from '../src/models/Workspace.js';
import { Task } from '../src/models/Task.js';
import { MeetingIntelligence } from '../src/models/MeetingIntelligence.js';

const seed = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/intellmeet';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for demo seeding...');

  // 1. Create or update Demo User
  let user = await User.findOne({ email: 'demo@intellmeet.com' });
  if (!user) {
    user = await User.create({
      name: 'Alex Morgan',
      email: 'demo@intellmeet.com',
      password: 'Password@123',
      title: 'Principal Systems Architect',
      department: 'Platform Engineering',
      bio: 'Leading collaboration architecture and WebRTC scaling at IntellMeet.'
    });
    console.log('Created Demo User: demo@intellmeet.com / Password@123');
  }

  // 2. Create Default Workspace
  let workspace = await Workspace.findOne({ owner: user._id });
  if (!workspace) {
    workspace = await Workspace.create({
      name: 'IntellMeet Core Engineering',
      slug: 'intellmeet-core',
      description: 'Central engineering workspace for enterprise collaboration platform development',
      owner: user._id,
      members: [{ user: user._id, role: 'owner', joinedAt: new Date() }]
    });
    console.log('Created Workspace: IntellMeet Core Engineering');
  }

  // 3. Create Sample Meetings
  const existingMeetings = await Meeting.countDocuments({ host: user._id });
  if (existingMeetings === 0) {
    const liveMeeting = await Meeting.create({
      title: 'Q3 WebRTC SFU Architecture & Media Relay',
      description: 'Discussing WebRTC mesh vs SFU and Redis clustering',
      meetingCode: 'IM-LIVE-901',
      host: user._id,
      workspace: workspace._id,
      status: 'live',
      actualStartTime: new Date(Date.now() - 25 * 60 * 1000)
    });

    const scheduledMeeting = await Meeting.create({
      title: 'AI Whisper Transcription & Summary Pipeline',
      description: 'Reviewing real-time audio chunk processing and prompt optimization',
      meetingCode: 'IM-PLAN-402',
      host: user._id,
      workspace: workspace._id,
      status: 'scheduled',
      scheduledStartTime: new Date(Date.now() + 2 * 3600 * 1000)
    });

    const endedMeeting = await Meeting.create({
      title: 'Sprint 24 Retrospective & Release Candidate QA',
      description: 'Sprint conclusion and security review',
      meetingCode: 'IM-PAST-103',
      host: user._id,
      workspace: workspace._id,
      status: 'ended',
      actualStartTime: new Date(Date.now() - 3 * 3600 * 1000),
      actualEndTime: new Date(Date.now() - 2 * 3600 * 1000)
    });

    // Add Meeting Intelligence to ended meeting
    await MeetingIntelligence.create({
      meeting: endedMeeting._id,
      summary: {
        overview: 'Sprint 24 completed all milestones ahead of schedule. The team finalized the core backend architecture, established JWT token rotation, and connected the React 19 client components with WebRTC signaling relays.',
        keyPoints: [
          'Backend API achieved 100% test pass rate on automated integration suite.',
          'Frontend UI components integrated with Zustand auth store and React Query.',
          'Signaling bridge configured to support peer offer/answer and ICE candidate exchange.',
          'DevOps health probe endpoint verified for Kubernetes liveness checks.'
        ],
        decisions: [
          'Adopted gpt-4o-mini for structured meeting intelligence extraction.',
          'Decided on hybrid in-memory TTL caching with Redis client connectivity.'
        ]
      },
      extractedActionItems: [
        {
          taskTitle: 'Integrate OpenAI Whisper audio transcription stream into socket handler',
          assigneeName: 'Rishika',
          priority: 'urgent'
        },
        {
          taskTitle: 'Configure multi-stage Docker build and Helm charts for cloud deployment',
          assigneeName: 'Vignesh',
          priority: 'high'
        },
        {
          taskTitle: 'Conduct responsive accessibility review for mobile lobby viewport',
          assigneeName: 'Vaishali',
          priority: 'medium'
        }
      ],
      sentiment: {
        score: 0.92,
        label: 'positive',
        positivePercent: 90,
        neutralPercent: 10,
        negativePercent: 0
      }
    });

    console.log('Seeded 3 realistic meetings + AI Intelligence report!');
  }

  // 4. Create Sample Tasks
  const taskCount = await Task.countDocuments({ workspace: workspace._id });
  if (taskCount === 0) {
    await Task.insertMany([
      {
        title: 'Complete WebRTC Peer Connection Handshake',
        description: 'Verify STUN/TURN server configuration and ICE candidate generation',
        workspace: workspace._id,
        status: 'in_progress',
        priority: 'urgent',
        assignee: user._id,
        reporter: user._id,
        order: 0
      },
      {
        title: 'Setup Kubernetes Manifests & CI/CD Pipeline',
        description: 'Build Dockerfile and configure GitHub Actions for staging deployment',
        workspace: workspace._id,
        status: 'todo',
        priority: 'high',
        reporter: user._id,
        order: 0
      },
      {
        title: 'Backend API Foundation & JWT Refresh Token Rotation',
        description: 'Implement Express routes, MongoDB Mongoose models, and error middleware',
        workspace: workspace._id,
        status: 'done',
        priority: 'high',
        assignee: user._id,
        reporter: user._id,
        order: 0
      },
      {
        title: 'AI Executive Summary Extraction with Action Items',
        description: 'Test JSON mode prompt extraction for post-meeting insights',
        workspace: workspace._id,
        status: 'todo',
        priority: 'medium',
        reporter: user._id,
        order: 1
      }
    ]);
    console.log('Seeded 4 Kanban workspace tasks!');
  }

  console.log('✅ Demo seeding complete!');
  await mongoose.connection.close();
};

seed().catch(console.error);

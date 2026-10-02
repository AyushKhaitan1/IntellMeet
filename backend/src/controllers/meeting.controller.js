import { Meeting } from '../models/Meeting.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { cache } from '../config/redis.js';

// Helper to generate 9-digit formatted meeting code: "XXX-YYY-ZZZ"
const generateMeetingCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const segment = (len) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${segment(3)}-${segment(3)}-${segment(3)}`.toUpperCase();
};

export const createMeeting = async (req, res, next) => {
  try {
    const {
      title,
      description,
      passcode,
      workspace,
      scheduledStartTime,
      scheduledEndTime,
      settings
    } = req.body;

    let meetingCode = generateMeetingCode();
    let existing = await Meeting.findOne({ meetingCode });
    while (existing) {
      meetingCode = generateMeetingCode();
      existing = await Meeting.findOne({ meetingCode });
    }

    const meeting = await Meeting.create({
      title,
      description: description || '',
      meetingCode,
      passcode: passcode || '',
      host: req.user._id,
      workspace: workspace || null,
      scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : new Date(),
      scheduledEndTime: scheduledEndTime ? new Date(scheduledEndTime) : null,
      settings: settings || {}
    });

    // Populate host
    await meeting.populate('host', 'name email avatar title');

    // Invalidate/cache meeting in Redis
    await cache.set(`meeting:${meetingCode}`, JSON.stringify(meeting), 'EX', 3600);

    return res
      .status(201)
      .json(ApiResponse.created(meeting, 'Meeting created successfully'));
  } catch (error) {
    next(error);
  }
};

export const getMyMeetings = async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const query = {
      $or: [{ host: req.user._id }, { 'participants.user': req.user._id }]
    };

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [meetings, total] = await Promise.all([
      Meeting.find(query)
        .populate('host', 'name email avatar')
        .sort({ scheduledStartTime: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Meeting.countDocuments(query)
    ]);

    return res.status(200).json(
      ApiResponse.success(
        meetings,
        'Meetings retrieved successfully',
        200,
        {
          total,
          page: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      )
    );
  } catch (error) {
    next(error);
  }
};

export const getMeetingByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const cleanCode = code.trim().toUpperCase();

    // Check cache first
    const cachedData = await cache.get(`meeting:${cleanCode}`);
    if (cachedData) {
      try {
        return res
          .status(200)
          .json(ApiResponse.success(JSON.parse(cachedData), 'Meeting fetched from cache'));
      } catch (e) {
        // Cache parse issue, fall through to DB
      }
    }

    const meeting = await Meeting.findOne({ meetingCode: cleanCode })
      .populate('host', 'name email avatar title')
      .populate('coHosts', 'name email avatar')
      .populate('workspace', 'name slug');

    if (!meeting) {
      return next(ApiError.notFound(`No meeting found with code: ${cleanCode}`));
    }

    // Refresh cache
    await cache.set(`meeting:${cleanCode}`, JSON.stringify(meeting), 'EX', 300);

    return res
      .status(200)
      .json(ApiResponse.success(meeting, 'Meeting details retrieved'));
  } catch (error) {
    next(error);
  }
};

export const joinMeeting = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { passcode, displayName } = req.body;
    const cleanCode = code.trim().toUpperCase();

    const meeting = await Meeting.findOne({ meetingCode: cleanCode });
    if (!meeting) {
      return next(ApiError.notFound('Meeting not found'));
    }

    if (meeting.status === 'ended' || meeting.status === 'cancelled') {
      return next(ApiError.badRequest(`This meeting has already ${meeting.status}.`));
    }

    // Check passcode
    if (meeting.passcode && meeting.passcode !== passcode) {
      return next(ApiError.unauthorized('Invalid meeting passcode.'));
    }

    // Participant details
    const isHost = req.user ? meeting.host.toString() === req.user._id.toString() : false;
    const participantName = req.user ? req.user.name : displayName || 'Guest Participant';
    const participantEmail = req.user ? req.user.email : '';
    const role = isHost ? 'host' : 'participant';

    // Mark status live if host joins
    if (isHost && meeting.status === 'scheduled') {
      meeting.status = 'live';
      meeting.actualStartTime = new Date();
    }

    // Record participant in meeting
    const participantEntry = {
      user: req.user ? req.user._id : null,
      name: participantName,
      email: participantEmail,
      role,
      joinedAt: new Date()
    };

    meeting.participants.push(participantEntry);
    await meeting.save();

    // Invalidate cache
    await cache.del(`meeting:${cleanCode}`);

    return res.status(200).json(
      ApiResponse.success(
        {
          meeting,
          participant: participantEntry,
          isHost
        },
        'Joined meeting successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

export const updateMeeting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return next(ApiError.notFound('Meeting not found'));
    }

    if (meeting.host.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(ApiError.forbidden('Only the host or admin can update this meeting'));
    }

    const { title, description, settings, status, passcode, recordingUrl } = req.body;

    if (title) meeting.title = title;
    if (description !== undefined) meeting.description = description;
    if (passcode !== undefined) meeting.passcode = passcode;
    if (recordingUrl !== undefined) meeting.recordingUrl = recordingUrl;
    if (settings) meeting.settings = { ...meeting.settings, ...settings };
    if (status) meeting.status = status;

    await meeting.save();
    await cache.del(`meeting:${meeting.meetingCode}`);

    return res
      .status(200)
      .json(ApiResponse.success(meeting, 'Meeting updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const endMeeting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return next(ApiError.notFound('Meeting not found'));
    }

    if (meeting.host.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(ApiError.forbidden('Only the host or admin can end this meeting'));
    }

    meeting.status = 'ended';
    meeting.actualEndTime = new Date();

    // Calculate participant durations
    meeting.participants = meeting.participants.map((p) => {
      if (!p.leftAt) {
        p.leftAt = new Date();
      }
      if (p.joinedAt) {
        p.durationSeconds = Math.round((new Date(p.leftAt) - new Date(p.joinedAt)) / 1000);
      }
      return p;
    });

    await meeting.save();
    await cache.del(`meeting:${meeting.meetingCode}`);

    return res
      .status(200)
      .json(ApiResponse.success(meeting, 'Meeting ended successfully'));
  } catch (error) {
    next(error);
  }
};

export const getMeetingHistory = async (req, res, next) => {
  try {
    const pastMeetings = await Meeting.find({
      status: 'ended',
      $or: [{ host: req.user._id }, { 'participants.user': req.user._id }]
    })
      .populate('host', 'name email avatar')
      .sort({ actualEndTime: -1 })
      .limit(30);

    return res
      .status(200)
      .json(ApiResponse.success(pastMeetings, 'Meeting history retrieved'));
  } catch (error) {
    next(error);
  }
};

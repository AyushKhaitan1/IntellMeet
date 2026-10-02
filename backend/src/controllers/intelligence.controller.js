import { MeetingIntelligence } from '../models/MeetingIntelligence.js';
import { Meeting } from '../models/Meeting.js';
import { Task } from '../models/Task.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const saveTranscript = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const { transcript } = req.body;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return next(ApiError.notFound('Meeting not found'));
    }

    let intelligence = await MeetingIntelligence.findOne({ meeting: meetingId });
    if (!intelligence) {
      intelligence = new MeetingIntelligence({
        meeting: meetingId,
        transcript: []
      });
    }

    // Append or replace transcript
    intelligence.transcript = [...intelligence.transcript, ...transcript];
    await intelligence.save();

    return res
      .status(200)
      .json(ApiResponse.success(intelligence.transcript, 'Transcript saved successfully'));
  } catch (error) {
    next(error);
  }
};

export const getTranscript = async (req, res, next) => {
  try {
    const { meetingId } = req.params;

    const intelligence = await MeetingIntelligence.findOne({ meeting: meetingId });
    if (!intelligence) {
      return res.status(200).json(ApiResponse.success([], 'No transcript found for meeting'));
    }

    return res
      .status(200)
      .json(ApiResponse.success(intelligence.transcript, 'Transcript fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export const saveSummaryAndActionItems = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const { summary, extractedActionItems, sentiment, aiModelUsed, audioRecordingUrl } = req.body;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return next(ApiError.notFound('Meeting not found'));
    }

    let intelligence = await MeetingIntelligence.findOne({ meeting: meetingId });
    if (!intelligence) {
      intelligence = new MeetingIntelligence({
        meeting: meetingId
      });
    }

    if (summary) intelligence.summary = summary;
    if (extractedActionItems) intelligence.extractedActionItems = extractedActionItems;
    if (sentiment) intelligence.sentiment = sentiment;
    if (aiModelUsed) intelligence.aiModelUsed = aiModelUsed;
    if (audioRecordingUrl) intelligence.audioRecordingUrl = audioRecordingUrl;

    await intelligence.save();

    return res
      .status(200)
      .json(ApiResponse.success(intelligence, 'Meeting AI intelligence saved successfully'));
  } catch (error) {
    next(error);
  }
};

export const getMeetingIntelligence = async (req, res, next) => {
  try {
    const { meetingId } = req.params;

    const intelligence = await MeetingIntelligence.findOne({ meeting: meetingId })
      .populate('extractedActionItems.assigneeUser', 'name email avatar')
      .populate('extractedActionItems.createdTaskId');

    if (!intelligence) {
      return res.status(200).json(
        ApiResponse.success(
          null,
          'No intelligence report generated yet for this meeting.'
        )
      );
    }

    return res
      .status(200)
      .json(ApiResponse.success(intelligence, 'Meeting intelligence report retrieved'));
  } catch (error) {
    next(error);
  }
};

export const convertActionItemToTask = async (req, res, next) => {
  try {
    const { meetingId, actionItemId } = req.params;
    const { workspaceId } = req.body;

    const intelligence = await MeetingIntelligence.findOne({ meeting: meetingId });
    if (!intelligence) {
      return next(ApiError.notFound('Intelligence record not found'));
    }

    const actionItem = intelligence.extractedActionItems.id(actionItemId);
    if (!actionItem) {
      return next(ApiError.notFound('Action item not found in meeting intelligence'));
    }

    // Create Kanban task
    const task = await Task.create({
      title: actionItem.taskTitle,
      description: `Extracted from Meeting action items. Assignee: ${actionItem.assigneeName}`,
      workspace: workspaceId,
      meeting: meetingId,
      status: 'todo',
      priority: actionItem.priority || 'medium',
      assignee: actionItem.assigneeUser || null,
      reporter: req.user._id,
      dueDate: actionItem.dueDate || null,
      tags: ['AI-Extracted', 'Meeting-Action-Item']
    });

    actionItem.createdTaskId = task._id;
    await intelligence.save();

    return res
      .status(201)
      .json(ApiResponse.created(task, 'Action item converted to Kanban task successfully'));
  } catch (error) {
    next(error);
  }
};

export const exportMeetingNotes = async (req, res, next) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findById(meetingId).populate('host', 'name email');
    if (!meeting) {
      return next(ApiError.notFound('Meeting not found'));
    }

    const intelligence = await MeetingIntelligence.findOne({ meeting: meetingId });

    let markdown = `# ${meeting.title}\n\n`;
    markdown += `**Meeting Code:** ${meeting.meetingCode}\n`;
    markdown += `**Host:** ${meeting.host ? meeting.host.name : 'Unknown'}\n`;
    markdown += `**Date:** ${new Date(meeting.createdAt).toLocaleString()}\n`;
    markdown += `**Participants:** ${meeting.participants ? meeting.participants.length : 0}\n\n`;

    if (intelligence && intelligence.summary) {
      markdown += `## Executive Summary\n${intelligence.summary.overview || 'N/A'}\n\n`;

      if (intelligence.summary.keyPoints && intelligence.summary.keyPoints.length > 0) {
        markdown += `## Key Discussion Points\n`;
        intelligence.summary.keyPoints.forEach((point) => {
          markdown += `- ${point}\n`;
        });
        markdown += `\n`;
      }

      if (intelligence.summary.decisions && intelligence.summary.decisions.length > 0) {
        markdown += `## Key Decisions Made\n`;
        intelligence.summary.decisions.forEach((dec) => {
          markdown += `- ${dec}\n`;
        });
        markdown += `\n`;
      }
    }

    if (intelligence && intelligence.extractedActionItems && intelligence.extractedActionItems.length > 0) {
      markdown += `## Action Items\n`;
      intelligence.extractedActionItems.forEach((item, index) => {
        markdown += `${index + 1}. **${item.taskTitle}** (Assignee: ${item.assigneeName}, Priority: ${item.priority})\n`;
      });
      markdown += `\n`;
    }

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${meeting.meetingCode}-notes.md"`);
    return res.status(200).send(markdown);
  } catch (error) {
    next(error);
  }
};

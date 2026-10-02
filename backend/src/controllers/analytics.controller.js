import { Meeting } from '../models/Meeting.js';
import { Task } from '../models/Task.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const getUserAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Total meetings hosted
    const totalHosted = await Meeting.countDocuments({ host: userId });

    // Total meetings participated
    const totalParticipated = await Meeting.countDocuments({
      'participants.user': userId
    });

    // Completed meetings duration
    const completedMeetings = await Meeting.find({
      status: 'ended',
      $or: [{ host: userId }, { 'participants.user': userId }]
    }).select('actualStartTime actualEndTime participants');

    let totalMeetingSeconds = 0;
    completedMeetings.forEach((m) => {
      if (m.actualStartTime && m.actualEndTime) {
        totalMeetingSeconds += Math.round((new Date(m.actualEndTime) - new Date(m.actualStartTime)) / 1000);
      }
    });

    // Task completion metrics
    const [assignedTasks, completedTasks] = await Promise.all([
      Task.countDocuments({ assignee: userId }),
      Task.countDocuments({ assignee: userId, status: 'done' })
    ]);

    const productivityScore =
      assignedTasks > 0 ? Math.round((completedTasks / assignedTasks) * 100) : 100;

    const data = {
      totalMeetings: totalHosted + totalParticipated,
      totalHosted,
      totalParticipated,
      totalMeetingHours: (totalMeetingSeconds / 3600).toFixed(1),
      tasks: {
        assigned: assignedTasks,
        completed: completedTasks,
        pending: assignedTasks - completedTasks,
        completionRate: `${productivityScore}%`
      }
    };

    return res
      .status(200)
      .json(ApiResponse.success(data, 'User analytics retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceAnalytics = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const [totalMeetings, totalTasks, tasksByStatus] = await Promise.all([
      Meeting.countDocuments({ workspace: workspaceId }),
      Task.countDocuments({ workspace: workspaceId }),
      Task.aggregate([
        { $match: { workspace: new Object(workspaceId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    return res.status(200).json(
      ApiResponse.success(
        {
          totalMeetings,
          totalTasks,
          tasksByStatus
        },
        'Workspace analytics retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

import { Task } from '../models/Task.js';
import { Workspace } from '../models/Workspace.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

// Helper to get or create a default workspace for a user
const getOrCreateDefaultWorkspace = async (userId) => {
  let ws = await Workspace.findOne({ 'members.user': userId });
  if (!ws) {
    const slug = `workspace-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    ws = await Workspace.create({
      name: 'Default Workspace',
      slug,
      description: 'Workspace for IntellMeet tasks',
      owner: userId,
      members: [{ user: userId, role: 'owner', joinedAt: new Date() }]
    });
  }
  return ws;
};

export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      workspace,
      meeting,
      status,
      priority,
      assignee,
      dueDate,
      tags
    } = req.body;

    let targetWorkspaceId = workspace;
    if (!targetWorkspaceId) {
      const defaultWs = await getOrCreateDefaultWorkspace(req.user._id);
      targetWorkspaceId = defaultWs._id;
    }

    // Normalize status from "in-progress" to "in_progress"
    const normalizedStatus = status === 'in-progress' ? 'in_progress' : status || 'todo';

    // Get max order in status column
    const highestOrderTask = await Task.findOne({
      workspace: targetWorkspaceId,
      status: normalizedStatus
    }).sort({ order: -1 });

    const order = highestOrderTask ? highestOrderTask.order + 1 : 0;

    const task = await Task.create({
      title,
      description: description || '',
      workspace: targetWorkspaceId,
      meeting: meeting || null,
      status: normalizedStatus,
      priority: priority || 'medium',
      assignee: assignee || null,
      reporter: req.user._id,
      dueDate: dueDate ? new Date(dueDate) : null,
      tags: tags || [],
      order
    });

    await task.populate('assignee', 'name email avatar title');
    await task.populate('reporter', 'name email avatar');

    const formattedTask = {
      _id: task._id.toString(),
      title: task.title,
      status: task.status === 'in_progress' ? 'in-progress' : task.status,
      assignee: task.assignee?.name || 'Unassigned',
      ...task.toObject()
    };

    if (req.originalUrl.startsWith('/api/tasks') && !req.originalUrl.startsWith('/api/v1/tasks')) {
      return res.status(201).json(formattedTask);
    }

    return res.status(201).json(ApiResponse.created(task, 'Task created successfully'));
  } catch (error) {
    next(error);
  }
};

export const getAllTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({
      $or: [{ reporter: req.user._id }, { assignee: req.user._id }]
    })
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .sort({ createdAt: -1 });

    const formattedTasks = tasks.map((t) => ({
      _id: t._id.toString(),
      title: t.title,
      status: t.status === 'in_progress' ? 'in-progress' : t.status,
      assignee: t.assignee?.name || 'Unassigned'
    }));

    if (req.originalUrl.startsWith('/api/tasks') && !req.originalUrl.startsWith('/api/v1/tasks')) {
      return res.status(200).json(formattedTasks);
    }

    return res.status(200).json(ApiResponse.success(formattedTasks, 'Tasks retrieved'));
  } catch (error) {
    next(error);
  }
};

export const getTasksByWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { groupByStatus = 'true' } = req.query;

    const tasks = await Task.find({ workspace: workspaceId })
      .populate('assignee', 'name email avatar title')
      .populate('reporter', 'name email avatar')
      .populate('meeting', 'title meetingCode')
      .sort({ order: 1, createdAt: -1 });

    if (groupByStatus === 'true') {
      const kanbanBoard = {
        todo: tasks.filter((t) => t.status === 'todo'),
        in_progress: tasks.filter((t) => t.status === 'in_progress'),
        in_review: tasks.filter((t) => t.status === 'in_review'),
        done: tasks.filter((t) => t.status === 'done')
      };
      return res.status(200).json(ApiResponse.success(kanbanBoard, 'Kanban tasks retrieved'));
    }

    return res.status(200).json(ApiResponse.success(tasks, 'Tasks retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { title, description, status, priority, assignee, dueDate, tags, order } = req.body;

    if (status === 'in-progress') status = 'in_progress';

    const task = await Task.findById(id);
    if (!task) {
      return next(ApiError.notFound('Task not found'));
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assignee !== undefined) task.assignee = assignee;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (tags !== undefined) task.tags = tags;
    if (order !== undefined) task.order = order;

    await task.save();
    await task.populate('assignee', 'name email avatar title');

    const formattedTask = {
      _id: task._id.toString(),
      title: task.title,
      status: task.status === 'in_progress' ? 'in-progress' : task.status,
      assignee: task.assignee?.name || 'Unassigned',
      ...task.toObject()
    };

    if (req.originalUrl.startsWith('/api/tasks') && !req.originalUrl.startsWith('/api/v1/tasks')) {
      return res.status(200).json(formattedTask);
    }

    return res.status(200).json(ApiResponse.success(task, 'Task updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const moveTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { status, order } = req.body;

    if (status === 'in-progress') status = 'in_progress';

    const task = await Task.findById(id);
    if (!task) {
      return next(ApiError.notFound('Task not found'));
    }

    task.status = status;
    if (order !== undefined) {
      task.order = order;
    }

    await task.save();

    return res.status(200).json(ApiResponse.success(task, 'Task status moved successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return next(ApiError.notFound('Task not found'));
    }

    return res.status(200).json(ApiResponse.success(null, 'Task deleted successfully'));
  } catch (error) {
    next(error);
  }
};

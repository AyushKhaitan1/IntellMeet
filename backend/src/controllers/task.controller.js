import { Task } from '../models/Task.js';
import { Workspace } from '../models/Workspace.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

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

    const workspaceDoc = await Workspace.findById(workspace);
    if (!workspaceDoc) {
      return next(ApiError.notFound('Target workspace not found'));
    }

    // Get max order in status column
    const highestOrderTask = await Task.findOne({
      workspace,
      status: status || 'todo'
    }).sort({ order: -1 });

    const order = highestOrderTask ? highestOrderTask.order + 1 : 0;

    const task = await Task.create({
      title,
      description: description || '',
      workspace,
      meeting: meeting || null,
      status: status || 'todo',
      priority: priority || 'medium',
      assignee: assignee || null,
      reporter: req.user._id,
      dueDate: dueDate ? new Date(dueDate) : null,
      tags: tags || [],
      order
    });

    await task.populate('assignee', 'name email avatar title');
    await task.populate('reporter', 'name email avatar');

    return res
      .status(201)
      .json(ApiResponse.created(task, 'Task created successfully'));
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
      return res
        .status(200)
        .json(ApiResponse.success(kanbanBoard, 'Kanban tasks retrieved'));
    }

    return res
      .status(200)
      .json(ApiResponse.success(tasks, 'Tasks retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assignee, dueDate, tags, order } = req.body;

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

    return res
      .status(200)
      .json(ApiResponse.success(task, 'Task updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const moveTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, order } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return next(ApiError.notFound('Task not found'));
    }

    task.status = status;
    if (order !== undefined) {
      task.order = order;
    }

    await task.save();

    return res
      .status(200)
      .json(ApiResponse.success(task, 'Task status moved successfully'));
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

    return res
      .status(200)
      .json(ApiResponse.success(null, 'Task deleted successfully'));
  } catch (error) {
    next(error);
  }
};

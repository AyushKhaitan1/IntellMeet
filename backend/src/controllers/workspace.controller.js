import { Workspace } from '../models/Workspace.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const createWorkspace = async (req, res, next) => {
  try {
    const { name, description, avatar } = req.body;

    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${baseSlug}-${uniqueSuffix}`;
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const workspace = await Workspace.create({
      name,
      slug,
      description: description || '',
      avatar: avatar || '',
      owner: req.user._id,
      inviteCode,
      members: [
        {
          user: req.user._id,
          role: 'owner',
          joinedAt: new Date()
        }
      ]
    });

    await workspace.populate('members.user', 'name email avatar title');

    return res
      .status(201)
      .json(ApiResponse.created(workspace, 'Workspace created successfully'));
  } catch (error) {
    next(error);
  }
};

export const getUserWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({
      'members.user': req.user._id
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar title')
      .sort({ updatedAt: -1 });

    return res
      .status(200)
      .json(ApiResponse.success(workspaces, 'Workspaces retrieved'));
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findById(id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar title department');

    if (!workspace) {
      return next(ApiError.notFound('Workspace not found'));
    }

    // Verify user is member
    const isMember = workspace.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );

    if (!isMember && req.user.role !== 'admin') {
      return next(ApiError.forbidden('You are not a member of this workspace'));
    }

    return res
      .status(200)
      .json(ApiResponse.success(workspace, 'Workspace details retrieved'));
  } catch (error) {
    next(error);
  }
};

export const inviteMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return next(ApiError.notFound('Workspace not found'));
    }

    // Check if requester has admin/owner rights
    const requesterMember = workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!requesterMember || (requesterMember.role !== 'owner' && requesterMember.role !== 'admin')) {
      return next(ApiError.forbidden('Only workspace owners or admins can invite members'));
    }

    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      return next(ApiError.notFound(`No user found with email: ${email}`));
    }

    const alreadyMember = workspace.members.some(
      (m) => m.user.toString() === invitedUser._id.toString()
    );
    if (alreadyMember) {
      return next(ApiError.conflict('User is already a member of this workspace'));
    }

    workspace.members.push({
      user: invitedUser._id,
      role: role || 'member',
      joinedAt: new Date()
    });

    await workspace.save();
    await workspace.populate('members.user', 'name email avatar title department');

    return res
      .status(200)
      .json(ApiResponse.success(workspace, 'Member invited successfully'));
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return next(ApiError.notFound('Workspace not found'));
    }

    const requesterMember = workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );

    const isSelfRemoval = req.user._id.toString() === userId;
    const isOwnerOrAdmin =
      requesterMember && (requesterMember.role === 'owner' || requesterMember.role === 'admin');

    if (!isSelfRemoval && !isOwnerOrAdmin) {
      return next(ApiError.forbidden('You do not have permission to remove this member'));
    }

    // Owner cannot be removed
    if (workspace.owner.toString() === userId) {
      return next(ApiError.badRequest('Workspace owner cannot be removed'));
    }

    workspace.members = workspace.members.filter(
      (m) => m.user.toString() !== userId
    );

    await workspace.save();

    return res
      .status(200)
      .json(ApiResponse.success(null, 'Member removed successfully'));
  } catch (error) {
    next(error);
  }
};

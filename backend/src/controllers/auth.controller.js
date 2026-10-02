import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { generateTokens, verifyRefreshToken } from '../utils/token.utils.js';
import { uploadMediaToCloud } from '../config/cloudinary.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, title, department } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(ApiError.conflict('An account with this email address already exists.'));
    }

    const user = await User.create({
      name,
      email,
      password,
      title: title || 'Team Member',
      department: department || 'Engineering'
    });

    const { accessToken, refreshToken } = generateTokens(user);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Set HTTP-only cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const userResponse = user.toJSON();

    return res
      .status(201)
      .json(
        ApiResponse.created(
          { user: userResponse, accessToken, refreshToken },
          'User registered successfully'
        )
      );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) {
      return next(ApiError.unauthorized('Invalid email or password.'));
    }

    const isMatch = await user.isPasswordMatch(password);
    if (!isMatch) {
      return next(ApiError.unauthorized('Invalid email or password.'));
    }

    const { accessToken, refreshToken } = generateTokens(user);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const userResponse = user.toJSON();

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { user: userResponse, accessToken, refreshToken },
          'Logged in successfully'
        )
      );
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;

    if (!token) {
      return next(ApiError.unauthorized('Refresh token is required.'));
    }

    const decoded = verifyRefreshToken(token);

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return next(ApiError.unauthorized('Invalid or expired refresh token. Please log in again.'));
    }

    const tokens = generateTokens(user);

    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res
      .status(200)
      .json(ApiResponse.success(tokens, 'Token refreshed successfully'));
  } catch (error) {
    return next(ApiError.unauthorized('Invalid or expired refresh token.'));
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    }

    res.clearCookie('refreshToken');

    return res
      .status(200)
      .json(ApiResponse.success(null, 'Logged out successfully'));
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return res
      .status(200)
      .json(ApiResponse.success(req.user, 'Current user profile fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, title, department, preferences } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return next(ApiError.notFound('User not found.'));
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (title !== undefined) user.title = title;
    if (department !== undefined) user.department = department;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    return res
      .status(200)
      .json(ApiResponse.success(user, 'Profile updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(ApiError.badRequest('No image file provided.'));
    }

    const uploadResult = await uploadMediaToCloud(req.file.path, 'intellmeet/avatars');

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        avatar: {
          url: uploadResult.url,
          publicId: uploadResult.publicId
        }
      },
      { new: true }
    );

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { avatar: user.avatar },
          'Avatar updated successfully'
        )
      );
  } catch (error) {
    next(error);
  }
};

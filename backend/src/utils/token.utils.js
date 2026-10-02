import jwt from 'jsonwebtoken';

export const generateTokens = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role
  };

  const accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'intellmeet_access_secret_key_prod_2026';
  const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'intellmeet_refresh_secret_key_prod_2026';

  const accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
  const refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';

  const accessToken = jwt.sign(payload, accessTokenSecret, {
    expiresIn: accessTokenExpiry
  });

  const refreshToken = jwt.sign(payload, refreshTokenSecret, {
    expiresIn: refreshTokenExpiry
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
  const secret = process.env.JWT_ACCESS_SECRET || 'intellmeet_access_secret_key_prod_2026';
  return jwt.verify(token, secret);
};

export const verifyRefreshToken = (token) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'intellmeet_refresh_secret_key_prod_2026';
  return jwt.verify(token, secret);
};

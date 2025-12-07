import jwt from 'jsonwebtoken';

const generateToken = (res, userId, role) => {
  // 1. Create Access Token (short-lived)
  const accessToken = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  // 2. Create Refresh Token (long-lived)
  const refreshToken = jwt.sign({ userId, role }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  });

  // 3. Set Refresh Token in an HTTP-Only Cookie
  // This is secure because client-side JS cannot access it.
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matches token expiry)
  });

  // 4. Return the Access Token (to be stored in memory/state by client)
  return accessToken;
};

export default generateToken;
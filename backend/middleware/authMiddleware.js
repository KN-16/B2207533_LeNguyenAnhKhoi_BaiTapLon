import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import Docgia from '../models/Docgia.js';
import NhanVien from '../models/NhanVien.js';

const requireAuth = asyncHandler(async (req, res, next) => {
  let token;

  // Read the JWT from the Authorization header
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      token = authHeader.split(' ')[1];

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by ID from token
      // We check both collections, as either a reader or staff could be authenticated
      let user =
        (await Docgia.findById(decoded.userId).select('-passwordHash')) ||
        (await NhanVien.findById(decoded.userId).select('-passwordHash'));

      if (user) {
        req.user = {
          id: user._id,
          role: user.role, // 'reader', 'admin', 'librarian'
        };
        next();
      } else {
        res.status(401);
        throw new Error('User not found');
      }
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

export { requireAuth };
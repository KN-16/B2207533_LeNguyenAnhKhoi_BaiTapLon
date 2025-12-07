import asyncHandler from 'express-async-handler';
import Docgia from '../models/Docgia.js';
import NhanVien from '../models/NhanVien.js';
import generateToken from '../utils/generateToken.js';
import TheoDoiMuonSach from '../models/TheoDoiMuonSach.js';

import jwt from 'jsonwebtoken';

/**
 * @desc    Login user (Reader or Staff) & get tokens
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { identifier, password, role } = req.body;
  let user=null;
  if (role===undefined || role===null) {
    return res.status(400).json({
      success: false,
      message: 'Role is required for login',
    });
  }
  if (role==='reader') {
  // Try finding user as a Reader (by username or Email)
    user=(await Docgia.findOne({ username: identifier })) ||
    (await Docgia.findOne({ email: identifier }));
  }
  else {
    // Try finding user as a Staff (by username or Email)
    user=(await NhanVien.findOne({ username: identifier })) ||
    (await NhanVien.findOne({ email: identifier }));
  }
  // Check user and password
  if (user && (await user.matchPassword(password))) {
    // Generate tokens
    const accessToken = generateToken(res, user._id, user.role);
    // Prepare user object to return (excluding sensitive data)
      let isBanned=false;
      let message_ban='';
      if (role==='reader') {
        const count = await TheoDoiMuonSach.countDocuments({
          MaDocGia: user._id,
          $or: [
            { status: 'late' },
            {
              status: { $in: ['borrowed', 'partial_returned'] },
              NgayTraDuKien: { $lt: new Date() }
            }
          ]
        });
        console.log(`User ${user.MaDocGia} has ${count} overdue borrow records.`);
        if (count >1){
          isBanned=true;
          message_ban=`Không thể mượn sách mới, vui lòng trả hết sách quá hạn trước.`;
        }}
      let userResponse;
      userResponse = {
        _id: user._id,
        MaDocGia: user.MaDocGia,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        username: user.username,
        isBanned,
        message_ban,
        DiaChi: user.DiaChi,
        SoDienThoai: user.SoDienThoai,
      };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      accessToken,
    });
  } else {
    res.status(401);
    throw new Error('Invalid identifier or password');
  }
});

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/auth/refresh
 * @access  Public (requires valid refresh token cookie)
 */
const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(401);
    throw new Error('Not authorized, no refresh token');
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Find user (check both collections)
    let user =
      (await Docgia.findById(decoded.userId).select('-passwordHash')) ||
      (await NhanVien.findById(decoded.userId).select('-passwordHash'));

    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    // Issue a new Access Token (Refresh token stays the same)
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, refresh token failed');
  }
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logoutUser = asyncHandler(async (req, res) => {
  // Clear the httpOnly refresh token cookie
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0), // Set to a past date
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully',
  });
});

/**
 * @desc    Get current authenticated user's profile
 * @route   GET /api/auth/profile
 * @access  Private (requireAuth)
 */
const getUserProfile = asyncHandler(async (req, res) => {
    // req.user is attached by requireAuth middleware
    // We need to fetch the full profile based on the ID and role
    
    let userProfile;
    if (req.user.role === 'reader') {
        userProfile = await Docgia.findById(req.user.id);
    } else {
        userProfile = await NhanVien.findById(req.user.id);
    }

    if (!userProfile) {
        res.status(404);
        throw new Error('User not found');
    }

    res.status(200).json({
        success: true,
        user: userProfile
    });
});

/**
 * @desc    Cập nhật thông tin cá nhân (Cho cả Admin/Staff & Reader)
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const userRole = req.user.role; // Lấy role từ middleware requireAuth
  const userId = req.user.id;
  
  let user;

  if (userRole === 'reader') {
    user = await Docgia.findById(userId);
  }
  else {
    user = await NhanVien.findById(userId);
  } 
  if (user) {
      user.HoLot = req.body.HoLot.trim() || user.HoLot;
      user.Ten = req.body.Ten.trim() || user.Ten;
      user.DiaChi = req.body.DiaChi.trim() || user.DiaChi;
      user.DienThoai = req.body.DienThoai || user.DienThoai;
      user.NgaySinh = req.body.NgaySinh || user.NgaySinh;
      user.Phai = req.body.Phai.trim() || user.Phai;
      user.email = req.body.email.trim() || user.email;

      if (req.body.currentPassword && req.body.newPassword) {
        if (await user.matchPassword(req.body.currentPassword.trim())) {
          user.passwordHash = req.body.newPassword.trim();
        }
        else
        {
          res.status(400);
          throw new Error('Current password is incorrect');
        }
      }
  }
  else 
  {
    res.status(404);
    throw new Error('Không tìm thấy người dùng');
  }
  const updatedUser = await user.save();
  // Trả về thông tin đã update (Bỏ password)
  const responseUser = userRole === 'reader' ? {
      MaDocGia: updatedUser.MaDocGia,
  } : {
      MSNV: updatedUser.MSNV,
  };
  responseUser._id = updatedUser._id
  responseUser.HoLot= updatedUser.HoLot;
  responseUser.Ten= updatedUser.Ten;
  responseUser.DiaChi= updatedUser.DiaChi;
  responseUser.DienThoai= updatedUser.DienThoai;
  responseUser.NgaySinh=updatedUser.NgaySinh;
  responseUser.Phai=updatedUser.Phai;
  responseUser.username= updatedUser.username;
  responseUser.email= updatedUser.email;
  responseUser.role= updatedUser.role;

  res.json({
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      user: responseUser
    });
});

export { loginUser, refreshToken, logoutUser, getUserProfile, updateUserProfile };
import asyncHandler from 'express-async-handler';
import Sach from '../models/Sach.js';
import NhaXuatBan from '../models/NhaXuatBan.js';
import TheoDoiMuonSach from '../models/TheoDoiMuonSach.js';
import mongoose from 'mongoose';

/**
 * @desc    Get all books with filtering, pagination, and search
 * @route   GET /api/sach
 * @access  Public
 */
const getAllBooks = asyncHandler(async (req, res) => {
  const pageSize = parseInt(req.query.limit) || 12;
  const page = parseInt(req.query.page) || 1;

  // Build Filter Object
  const filter = {};
  if (req.query.search) {
    // Use text index for search
    filter.$text = { $search: req.query.search };
  }
  if (req.query.MaNXB) {
    filter.MaNXB = req.query.MaNXB;
  }
  if (req.query.NamXuatBan) {
    filter.NamXuatBan = parseInt(req.query.NamXuatBan);
  }
  if (req.query.TacGia) {
    filter.TacGia = { $in: [new RegExp(req.query.TacGia, 'i')] };
  }
  if (req.query.tags) {
    filter.tags = { $in: req.query.tags.split(',') };
  }

  // Sorting
  const sort = {};
  if (req.query.sortBy === 'year_desc') {
    sort.NamXuatBan = -1;
  } else if (req.query.sortBy === 'year_asc') {
    sort.NamXuatBan = 1;
  } else if (req.query.sortBy === 'name_asc') {
    sort.TenSach = 1;
  } else if (req.query.sortBy === 'name_desc') {
    sort.TenSach = -1;
  } else {
    sort.createdAt = -1; // Default sort
  }

  const count = await Sach.countDocuments(filter);
  const books = await Sach.find(filter)
    .populate('MaNXB') // Populate publisher name
    .sort(sort)
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.status(200).json({
    success: true,
    books,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

/**
 * @desc    Get all books with filtering, pagination, and search for Page Reader
 * @route   GET /api/sach/reader
 * @access  Public
 */
const getAllBooksReader = asyncHandler(async (req, res) => {
  const pageSize = parseInt(req.query.limit) || 12;
  const page = parseInt(req.query.page) || 1;

  // --- 1. XÂY DỰNG FILTER ---
  const filter = {};

  // Tìm kiếm (Search): Tên sách HOẶC Tác giả
  if (req.query.search) {
    // 'i' flag: Không phân biệt hoa thường
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    
    filter.$or = [
      { TenSach: searchRegex },
      { TacGia:  searchRegex  } // Tìm trong mảng tác giả
    ];
  }

  // Lọc chính xác
  if (req.query.MaNXB) {
    filter.MaNXB = req.query.MaNXB;
  }

  if (req.query.NamXuatBan) {
    filter.NamXuatBan = parseInt(req.query.NamXuatBan);
  }

  // --- 2. XỬ LÝ SORT (Dynamic) ---
  // Frontend gửi: "TenSach_asc", "createdAt_desc"
  let sort = { createdAt: -1 }; // Mặc định: Mới nhất

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split('_'); // Tách chuỗi tại dấu gạch dưới
    // parts[0] = Tên trường (TenSach)
    // parts[1] = Hướng (asc/desc)
    
    if (parts.length === 2) {
      const field = parts[0];
      const direction = parts[1] === 'asc' ? 1 : -1;
      
      // Tạo object sort động: { TenSach: 1 }
      sort = { [field]: direction };
    }
  }
  // --- 3. QUERY DATABASE ---
  const count = await Sach.countDocuments(filter);
  // console.log('Count:', count);
  const books = await Sach.find(filter)
    .populate('MaNXB', 'TenNXB') // Chỉ lấy tên NXB cho nhẹ
    .sort(sort)
    .limit(pageSize)
    .skip(pageSize * (page - 1));
  // console.log('Books:', books);
  res.status(200).json({
    success: true,
    books,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

/**
 * @desc    Get a single book by ID
 * @route   GET /api/sach/:id
 * @access  Public
 */
const getBookById = asyncHandler(async (req, res) => {
  const book = await Sach.findById(req.params.id).populate('MaNXB', 'TenNXB');

  if (book) {
    res.status(200).json({
      success: true,
      book,
    });
  } else {
    res.status(404);
    throw new Error('Book not found');
  }
});

/**
 * @desc    Get "Hot Books" based on borrow count and pins
 * @route   GET /api/sach/hot
 * @access  Public
 */
const getHotBooks = asyncHandler(async (req, res) => {
  const topN = parseInt(req.query.limit) || 10;
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 1. Get manually pinned books
  const pinnedBooks = await Sach.find({ pinnedHot: true }).populate('MaNXB', 'TenNXB');
  const pinnedBookIds = pinnedBooks.map(b => b._id);

  // 2. Calculate scores for non-pinned books
  const scoredBooks = await TheoDoiMuonSach.aggregate([
    // Find borrow records in the last 90 days
    {
      $match: {
        NgayMuon: { $gte: ninetyDaysAgo },
        // Exclude books that are already pinned
        MaSach: { $nin: pinnedBookIds } 
      },
    },
    // Group by book ID (MaSach)
    {
      $group: {
        _id: '$MaSach',
        borrowLast90Days: { $sum: 1 },
        borrowLast30Days: {
          $sum: {
            $cond: [{ $gte: ['$NgayMuon', thirtyDaysAgo] }, 1, 0],
          },
        },
      },
    },
    // Calculate the score
    {
      $project: {
        score: {
          $add: [
            '$borrowLast90Days',
            { $multiply: ['$borrowLast30Days', 2] }, // 30-day borrows count 2x
          ],
        },
      },
    },
    // Sort by score descending
    { $sort: { score: -1 } },
    // Limit to top N
    { $limit: topN },
    // Lookup book details
    {
      $lookup: {
        from: 'saches', // collection name for 'Sach' model
        localField: '_id',
        foreignField: '_id',
        as: 'bookDetails',
      },
    },
    // Deconstruct the bookDetails array
    { $unwind: '$bookDetails' },
    // Lookup publisher details
    {
      $lookup: {
        from: 'nhaxuatbans', // collection name for 'NhaXuatBan' model
        localField: 'bookDetails.MaNXB',
        foreignField: '_id',
        as: 'bookDetails.MaNXB',
      },
    },
     { $unwind: { path: '$bookDetails.MaNXB', preserveNullAndEmptyArrays: true } },
    // Format the output
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$bookDetails', { score: '$score' }],
        },
      },
    },
  ]);
  
  // 3. Combine pinned books and scored books
  // Pinned books always come first
  const combinedResults = [...pinnedBooks, ...scoredBooks];

  // Remove duplicates (in case a scored book was somehow also pinned - logic above prevents this, but good practice)
  const uniqueResults = Array.from(new Map(combinedResults.map(book => [book._id.toString(), book])).values());
  
  // Return the top N results
  const hotBooks = uniqueResults.slice(0, topN);

  res.status(200).json({
    success: true,
    hotBooks,
  });
});

export { getAllBooks, getBookById, getHotBooks,getAllBooksReader };
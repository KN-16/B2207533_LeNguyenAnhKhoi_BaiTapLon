import asyncHandler from 'express-async-handler';
import Sach from '../models/Sach.js';
import Docgia from '../models/Docgia.js';
import NhaXuatBan from '../models/NhaXuatBan.js';
import TheoDoiMuonSach from '../models/TheoDoiMuonSach.js';
import Counter from '../models/Counter.js';
import NhanVien from '../models/NhanVien.js';
import { getHotBooks } from './bookController.js';
import mongoose from 'mongoose';
import deleteFile from '../utils/fileUtils.js';
import { returnBook, updateBorrow } from './borrowController.js';

// --- Dashboard ---

/**
 * @desc    Lấy số liệu thống kê cho Dashboard
 * @route   GET /api/admin/stats
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  
  // 1. Đếm tổng quan
  const totalBooks = await Sach.countDocuments();
  const totalReaders = await Docgia.countDocuments();
  
  // 2. Thống kê Phiếu mượn
  const totalBorrows = await TheoDoiMuonSach.countDocuments();
  
  // Đếm số phiếu đang hoạt động (Đang mượn + Trễ hạn)
  const activeBorrows = await TheoDoiMuonSach.countDocuments({
    status: { $in: ['borrowed', 'late', 'partial_returned'] }
  });

  // Đếm số phiếu quá hạn
  const overdueBorrows = await TheoDoiMuonSach.countDocuments({
      $or: [
          { status: 'late' },
          { 
              status: { $in: ['borrowed', 'partial_returned'] }, 
              NgayTraDuKien: { $lt: new Date() } 
          }
      ]
  });

  // 3. Tính tổng số cuốn sách đang được mượn (Phải dùng Aggregate vì nằm trong mảng)
  const booksBeingBorrowed = await TheoDoiMuonSach.aggregate([
    { $match: { status: { $in: ['borrowed', 'late', 'partial_returned'] } } },
    { $unwind: '$ChiTietMuon' },
    { $group: { _id: null, total: { $sum: { $subtract: ['$ChiTietMuon.SoLuong', '$ChiTietMuon.DaTra'] } } } }
  ]);
  const totalBooksOut = booksBeingBorrowed[0]?.total || 0;

  // 4. Biểu đồ mượn sách 7 ngày gần nhất
  const loanTrend = await TheoDoiMuonSach.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$NgayMuon" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }, // Sắp xếp ngày giảm dần (ngày mới nhất lên đầu)
    { $limit: 7 },          // Chỉ lấy 7 ngày có dữ liệu gần nhất
    { $sort: { _id: 1 } }   // Sắp xếp lại tăng dần để Frontend vẽ đúng thứ tự thời gian (Cũ -> Mới)
  ]);

  res.json({
    success: true,
    stats: {
      totalBooks,
      totalReaders,
      totalBorrows, // Tổng số phiếu lịch sử
      activeBorrows, // Số phiếu đang mượn
      overdueBorrows,
      totalBooksOut // Số cuốn sách đang nằm ngoài thư viện
    },
    chartData: loanTrend
  });
});

// --- Báo cáo ---

/**
 * @desc    Báo cáo Sách Hot & Độc giả tích cực
 * @route   GET /api/admin/report/top
 */
const getTopReports = asyncHandler(async (req, res) => {
  // 1. Top 5 Sách mượn nhiều nhất
  const topBooks = await TheoDoiMuonSach.aggregate([
    { $unwind: '$ChiTietMuon' }, // Bung mảng chi tiết ra
    {
      $group: {
        _id: '$ChiTietMuon.MaSach',
        totalBorrowed: { $sum: '$ChiTietMuon.SoLuong' } // Cộng dồn số lượng mượn
      }
    },
    { $sort: { totalBorrowed: -1, _id: 1 } }, // Sắp xếp giảm dần
    { $limit: 5 },
    // Join với bảng Sach để lấy tên
    {
      $lookup: {
        from: 'saches',
        localField: '_id',
        foreignField: '_id',
        as: 'bookInfo'
      }
    },
    { $unwind: '$bookInfo' },
    {
      $project: {
        TenSach: '$bookInfo.TenSach',
        MaSach: '$bookInfo.MaSach',
        totalBorrowed: 1
      }
    },
    { $sort: { totalBorrowed: -1, MaSach: 1 } }
  ]);

  // 2. Top 5 Đọc giả mượn nhiều nhất (Theo số lần tạo phiếu)
  const topReaders = await TheoDoiMuonSach.aggregate([
    {
      $group: {
        _id: '$MaDocGia',
        borrowCount: { $sum: 1 }
      }
    },
    { $sort: { borrowCount: -1, _id: 1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'docgias',
        localField: '_id',
        foreignField: '_id',
        as: 'readerInfo'
      }
    },
    { $unwind: '$readerInfo' },
    {
      $project: {
        HoTen: { $concat: ['$readerInfo.HoLot', ' ', '$readerInfo.Ten'] },
        MaDocGia: '$readerInfo.MaDocGia',
        borrowCount: 1
      }
    },
    { $sort: { borrowCount: -1, MaDocGia: 1 } }
  ]);

  res.json({
    success: true,
    topBooks,
    topReaders
  });
});
// --- Book Management (CRUD) ---

/**
 * @desc    Create a new book
 * @route   POST /api/admin/sach
 * @access  Private (Admin/Librarian)
 */

const createBook = asyncHandler(async (req, res) => {
  // 1. Remove MaSach from input (it is auto-gen)
  const { TenSach, SoQuyen, SoQuyenConLai, NamXuatBan, MaNXB, TacGia, tags, pinnedHot, } = req.body;

  // 2. Handle File Upload
  const coverUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

  // 3. START TRANSACTION
  let session = null;
  const enableTransaction = process.env.ENABLE_TRANSACTION === 'true';
  if (enableTransaction) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  try {
    // A. Atomically increment the counter
    // We look for a counter named 'MaSach'. If it doesn't exist, 'upsert' creates it starting at 0.
    // 'new: true' returns the updated document.
    const counter = await Counter.findOneAndUpdate(
      { model_name: 'Sach' },  // Look for counter for 'Sach' model
      { $inc: { seq: 1 } },
      { new: true, upsert: true, session }
    );

    // B. Format the ID (e.g., 1 -> "S-0001")
    // padStart(4, '0') ensures we always have 4 digits.
    const autoGeneratedMaSach = `S-${counter.seq.toString().padStart(4, '0')}`;

    // C. Prepare data with the generated ID
    const newBookData = {
      MaSach: autoGeneratedMaSach,
      TenSach,
      SoQuyen,
      SoQuyenConLai,
      NamXuatBan,
      // Ensure arrays are handled correctly even if sent as strings
      TacGia: Array.isArray(TacGia) ? TacGia : (TacGia ? TacGia.split(',').map(t => t.trim()) : []),
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      pinnedHot,
      coverUrl,
    };
    // Create NXB
    if (MaNXB === 'new') {
      const counter_NXB = await Counter.findOneAndUpdate(
      { model_name: 'NhaXuatBan' },  // Look for counter for 'Sach' model
      { $inc: { seq: 1 } },
      { new: true, upsert: true, session }
    );
      const autoGeneratedMaNXB = `NXB-${counter_NXB.seq.toString().padStart(4, '0')}`;
      const { TenNXB, DiaChi } = req.body;
      const [newNXB] = await NhaXuatBan.create([{ MaNXB: autoGeneratedMaNXB, TenNXB, DiaChi }], { session });
      newBookData.MaNXB = newNXB._id;
    }
    else 
    {
      newBookData.MaNXB = MaNXB;
    }
    // D. Create the Book inside the session
    // Note: When using transactions, pass the array [newBookData] and { session }
    const [newBook] = await Sach.create([newBookData], { session });

    // E. If we get here, everything is good. COMMIT changes.
    if (enableTransaction)
    {
      await session.commitTransaction();
    }

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      book: newBook,
    });

  } catch (error) {
    // F. If ANY error occurs above, ABORT transaction.
    // This reverts the Counter increment and ensures no partial data is saved.
    
    if (enableTransaction) {
      await session.abortTransaction();
    }
    // If there was a file uploaded, delete it to prevent orphaned files
    if (coverUrl) {
      deleteFile(coverUrl);
    }
    // Throw error to be handled by your global error handler
    res.status(400);
    throw new Error(error.message || 'Failed to create book');
  } finally {
    // G. Always end the session
    if (enableTransaction) {
      session.endSession();
    }
  }
});

/**
 * @desc    Update a book
 * @route   PUT /api/admin/sach/:id
 * @access  Private (Admin/Librarian)
 */

const updateBook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { TenSach, SoQuyen, SoQuyenConLai, NamXuatBan, MaNXB, TacGia, tags, pinnedHot } = req.body;

  // 1. Check if a new file was uploaded
  const newCoverUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

  // 2. Find the existing book BEFORE updating (We need to know the OLD image path)
  const oldBook = await Sach.findById(id);

  if (!oldBook) {
    // ROLLBACK: If book not found, but we uploaded a file, delete the new file!
    if (newCoverUrl) deleteFile(newCoverUrl);
    
    res.status(404);
    throw new Error('Book not found');
  }

  const enableTransaction = process.env.ENABLE_TRANSACTION === 'true';
  //Validate SoQuyenConLai
  let borrows=await TheoDoiMuonSach.find({ChiTietMuon: {
    $elemMatch: {
      MaSach: id
    }
  }, status: { $in: ['borrowed', 'late', 'partial_returned'] } })
  let SoQuyenDangMuon=0;
  borrows.forEach(borrow=>{
    borrow.ChiTietMuon.forEach(item=>{
      if(item.MaSach.toString()===id)
      {
        SoQuyenDangMuon+= (item.SoLuong - item.DaTra);
        return;
      }
  })
  });
  if (parseInt(SoQuyenConLai)+SoQuyenDangMuon > parseInt(SoQuyen)) {
    if (newCoverUrl) deleteFile(newCoverUrl);
    res.status(400);
    throw new Error('Số quyển còn lại không đúng, có lỗi trong cập nhật,vui lòng tải lại trang');
  }
  // START TRANSACTION
  let session = null;
  if (enableTransaction) {
    session = await mongoose.startSession(); 
    session.startTransaction();
  }
  try {
    // 3. Prepare Update Data
    const updateData = {
      TenSach,
      SoQuyen,
      SoQuyenConLai,
      NamXuatBan,
      TacGia: Array.isArray(TacGia) ? TacGia : (TacGia ? TacGia.split(',').map(t => t.trim()) : undefined),
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : undefined),
      pinnedHot,
    };

    // Only update coverUrl if a new one exists
    if (newCoverUrl) {
      updateData.coverUrl = newCoverUrl;
    }

    // Handle MaNXB update
    if (MaNXB) {
      if (MaNXB === 'new') {
        const counter_NXB = await Counter.findOneAndUpdate(
        { model_name: 'NhaXuatBan' },  // Look for counter for 'Sach' model
        { $inc: { seq: 1 } },
        { new: true, upsert: true , session }
      );
        const autoGeneratedMaNXB = `NXB-${counter_NXB.seq.toString().padStart(4, '0')}`;
        const { TenNXB, DiaChi } = req.body;
        const [newNXB] = await NhaXuatBan.create([{ MaNXB: autoGeneratedMaNXB, TenNXB, DiaChi }], { session });
        updateData.MaNXB = newNXB._id;
      }
      else 
      {
        updateData.MaNXB = MaNXB;
      }
    }

    // 4. Update Database
    const updatedBook = await Sach.findByIdAndUpdate(id, updateData, {
      new: true,       // Return the updated document
      runValidators: true , // Ensure schema rules (min/max) are checked
      session,         
    });
    // 5. COMMIT Transaction
    if (enableTransaction) {
      await session.commitTransaction();
      session.endSession();
    }
    // --- SCENARIO A: SUCCESS CLEANUP ---
    // If update worked AND we uploaded a NEW file, delete the OLD file
    if (newCoverUrl && oldBook.coverUrl) {
      // Optional: Don't delete if it matches the default placeholder
      if (!oldBook.coverUrl) {
         deleteFile(oldBook.coverUrl);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      book: updatedBook,
    });

  } catch (error) {
    console.error('Failed to update book:', error);
    // --- SCENARIO B: ERROR ROLLBACK ---
    // The DB update failed (validation error, etc.), but Multer already saved the file.
    // We must delete the NEW file so it doesn't become "junk".
    if (newCoverUrl) {
      deleteFile(newCoverUrl);
    }
    if (enableTransaction) {
      await session.abortTransaction();
      session.endSession();
    }
    // Pass error to global handler
    res.status(400);
    throw error;
  }
});

/**
 * @desc    Delete a book
 * @route   DELETE /api/admin/sach/:id
 * @access  Private (Admin/Librarian)
 */
const deleteBook = asyncHandler(async (req, res) => {
  const book = await Sach.findById(req.params.id);

  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  // TODO: Add check: Do not delete if there are active borrow records
  const activeBorrows = await TheoDoiMuonSach.countDocuments({
    MaSach: book._id,
    status: { $in: ['borrowed', 'late'] }
  });

  if (activeBorrows > 0) {
    res.status(400);
    throw new Error('Cannot delete book. There are active borrow records associated with it.');
  }
  if (book.coverUrl) {
    deleteFile(book.coverUrl);
  }
  await book.deleteOne();
  // TODO: Add logic to delete associated cover image file

  res.status(200).json({
    success: true,
    message: 'Book deleted successfully',
  });
});

// --- Publisher Management (CRUD) ---
// (We already have getAllBooks which handles public listing)

/**
 * @desc    Get all publishers (for admin lists)
 * @route   GET /api/admin/nxb
 * @access  Private (Admin/Librarian)
 */
const getAllPublishers = asyncHandler(async (req, res) => {
    const publishers = await NhaXuatBan.find({}).sort({ TenNXB: 1 });
    res.status(200).json({ success: true, publishers });
});


/**
 * @desc    Create a new publisher
 * @route   POST /api/admin/nxb
 * @access  Private (Admin/Librarian)
 */
const createPublisher = asyncHandler(async (req, res) => {
  const { TenNXB, DiaChi } = req.body;

  // Start transaction
  let session = null;
  const enableTransaction = process.env.ENABLE_TRANSACTION === 'true';
  if (enableTransaction) {
    session = await mongoose.startSession();
    session.startTransaction();
  }
  try {
  const MaNXB= await Counter.findOneAndUpdate(
    { model_name: 'NhaXuatBan' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true , session }
  );
  const autoGeneratedMaNXB = `NXB-${MaNXB.seq.toString().padStart(4, '0')}`;

  const publisher = await NhaXuatBan.create([{ MaNXB: autoGeneratedMaNXB, TenNXB, DiaChi }], { session });
  if (enableTransaction) {
    await session.commitTransaction();
    session.endSession();
  }
  res.status(201).json({
    success: true,
    message: 'Publisher created',
    publisher,
  });
  } catch (error) {
    if (enableTransaction) {
      await session.abortTransaction();
      session.endSession();
    }
    res.status(400);
    throw error;
  }
});

/**
 * @desc    Update a publisher
 * @route   PUT /api/admin/nxb/:id
 * @access  Private (Admin/Librarian)
 */
const updatePublisher = asyncHandler(async (req, res) => {
    const publisher = await NhaXuatBan.findById(req.params.id);
    if (!publisher) {
        res.status(404);
        throw new Error('Publisher not found');
    }
    let session = null;
    const enableTransaction = process.env.ENABLE_TRANSACTION === 'true';
    if (enableTransaction) {
      session = await mongoose.startSession();
      session.startTransaction();
    }
    try {
    
    publisher.TenNXB = req.body.TenNXB || publisher.TenNXB;
    publisher.DiaChi = req.body.DiaChi || publisher.DiaChi;

    const updatedPublisher = await publisher.save();
    if (enableTransaction) {
      await session.commitTransaction();
      await session.endSession();
    }
    res.status(200).json({ success: true, publisher: updatedPublisher });
    } catch (error) {
      if (enableTransaction) {
        await session.abortTransaction();
        await session.endSession();
      }
      res.status(400);
      throw error;
    }
    });

/**
 * @desc    Delete a publisher
 * @route   DELETE /api/admin/nxb/:id
 * @access  Private (Admin/Librarian)
 */
const deletePublisher = asyncHandler(async (req, res) => {
    const publisher = await NhaXuatBan.findById(req.params.id);
    if (!publisher) {
        res.status(404);
        throw new Error('Publisher not found');
    }

    // Check if any books use this publisher
    const booksCount = await Sach.countDocuments({ MaNXB: publisher._id });
    if (booksCount > 0) {
        res.status(400);
        throw new Error('Cannot delete publisher. It is associated with active books.');
    }

    await publisher.deleteOne();
    res.status(200).json({ success: true, message: 'Publisher deleted' });
});


// --- Reader Management (CRUD) ---

/**
 * @desc    Get all readers (Docgia)
 * @route   GET /api/admin/docgia
 * @access  Private (Admin/Librarian)
 */
const getAllReaders = asyncHandler(async (req, res) => {
  const pageSize = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;

  const keyword = req.query.search
    ? {
        $or: [
          { Ten: { $regex: req.query.search, $options: 'i' } },
          { HoLot: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } },
          { MaDocGia: { $regex: req.query.search, $options: 'i' } },
        ],
      }
    : {};

  const count = await Docgia.countDocuments({ ...keyword });
  const readers = await Docgia.find({ ...keyword })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.status(200).json({
    success: true,
    readers,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

/**
 * @desc    Get reader by ID
 * @route   GET /api/admin/docgia/:id
 * @access  Private (Admin/Librarian)
 */
const getReaderById = asyncHandler(async (req, res) => {
    const reader = await Docgia.findById(req.params.id);
    if (!reader) {
        res.status(404);
        throw new Error('Reader not found');
    }
    res.status(200).json({ success: true, reader });
});

/**
 * @desc    Update a reader
 * @route   PUT /api/admin/docgia/:id
 * @access  Private (Admin/Librarian)
 */
const updateReader = asyncHandler(async (req, res) => {
    const reader = await Docgia.findById(req.params.id);
    if (!reader) {
        res.status(404);
        throw new Error('Reader not found');
    }
    //Session
    let session = null;
    const enableTransaction = process.env.ENABLE_TRANSACTION === 'true';
    if (enableTransaction) {
      session = await mongoose.startSession(); 
      session.startTransaction();
    }
    try {
    // Update fields
    reader.HoLot = req.body.HoLot || reader.HoLot;
    reader.Ten = req.body.Ten || reader.Ten;
    reader.NgaySinh = req.body.NgaySinh || reader.NgaySinh;
    reader.Phai = req.body.Phai || reader.Phai;
    reader.DiaChi = req.body.DiaChi || reader.DiaChi;
    reader.DienThoai = req.body.DienThoai || reader.DienThoai;
    reader.email = req.body.email || reader.email;

    // Optional: Update password
    if (req.body.password) {
        reader.passwordHash = req.body.password; // Hash hook will run
    }

    const updatedReader = await reader.save();
    if (enableTransaction) {
      await session.commitTransaction();
      await session.endSession();      
    }
    res.status(200).json({ success: true, reader: updatedReader });
    } catch (error) {
      if (enableTransaction) {
        await session.abortTransaction();
        await session.endSession();
      }
      res.status(400);
      throw new Error(error.message || 'Failed to update reader');
    }
});

/**
 * @desc    Delete a reader
 * @route   DELETE /api/admin/docgia/:id
 * @access  Private (Admin/Librarian)
 */
const deleteReader = asyncHandler(async (req, res) => {
    const reader = await Docgia.findById(req.params.id);
    if (!reader) {
        res.status(404);
        throw new Error('Reader not found');
    }

    // Check for active borrows
    const activeBorrows = await TheoDoiMuonSach.countDocuments({
        MaDocGia: reader._id,
        status: { $in: ['borrowed', 'late'] }
    });

    if (activeBorrows > 0) {
        res.status(400);
        throw new Error('Cannot delete reader. They have active borrow records.');
    }

    await reader.deleteOne();
    res.status(200).json({ success: true, message: 'Reader deleted' });
});

const createReader = asyncHandler(async (req, res) => {
  const { username,HoLot, Ten, NgaySinh, Phai, DiaChi, DienThoai, email, password } = req.body;
  
  const readerExists = await Docgia.findOne({ email }) || await Docgia.findOne({ username });
  if (readerExists) {
    res.status(400);
    throw new Error('Reader with this email or username already exists');
  }
  // START TRANSACTION
  let session = null;
  const enableTransaction = process.env.ENABLE_TRANSACTION === 'true';
  if (enableTransaction) {
    session = await mongoose.startSession();
    session.startTransaction();
  }
  
  try {
  const MaDocGia = await Counter.findOneAndUpdate(
    { model_name: 'Docgia' },  // Look for counter for 'Docgia' model
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  );
  const autoGeneratedMaDocGia = `DG-${MaDocGia.seq.toString().padStart(4, '0')}`;

  const reader = await Docgia.create([{
    MaDocGia: autoGeneratedMaDocGia,
    username,
    HoLot,
    Ten,
    NgaySinh,
    Phai,
    DiaChi,
    DienThoai,
    email,
    passwordHash: password, // The pre-save hook will hash this
  }], { session });
  
  if (enableTransaction) {
    await session.commitTransaction();
    await session.endSession();
  }
  res.status(201).json({
    success: true,
    message: 'Reader created successfully',
    reader: reader[0],
  });
} catch (error) {
  if (enableTransaction) {
    await session.abortTransaction();
    await session.endSession();
  }
  res.status(400);
  throw new Error(error.message || 'Failed to create reader');
}
});

// --- Borrow Management ---

/**
 * @desc    Get all borrow records (for admin)
 * @route   GET /api/admin/muon
 * @access  Private (Admin/Librarian)
 */
const getAllBorrowRecords = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { search, status, sortBy, sortType } = req.query;

  // --- 1. XÂY DỰNG FILTER ---
  const filter = {};
  
  if (status) {
    filter.status = status;
  }

  // --- 2. XỬ LÝ TÌM KIẾM THÔNG MINH (SEARCH) ---
  if (search) {
    const searchRegex = { $regex: search, $options: 'i' };

    // A. Tìm Độc Giả (Dùng Aggregate để gộp Họ + Tên)
    const foundReaders = await Docgia.aggregate([
      {
        // Tạo ra một trường ảo 'fullName' bằng cách nối HoLot + " " + Ten
        $addFields: {
          fullName: { $concat: ["$HoLot", " ", "$Ten"] }
        }
      },
      {
        // Tìm kiếm trên trường ảo fullName HOẶC MaDocGia HOẶC Email
        $match: {
          $or: [
            { fullName: searchRegex },
            { MaDocGia: searchRegex },
            { email: searchRegex }
          ]
        }
      },
      { $project: { _id: 1 } } // Chỉ lấy ID
    ]);
    const readerIds = foundReaders.map(r => r._id);

    // B. Tìm Sách (Theo Tên hoặc Mã)
    const foundBooks = await Sach.find({
      $or: [
        { TenSach: searchRegex },
        { MaSach: searchRegex }
      ]
    }).select('_id');
    const bookIds = foundBooks.map(b => b._id);

    // C. Gộp vào Filter chính của Phiếu Mượn
    filter.$or = [
      { MaMuonSach: searchRegex },               // Tìm theo Mã Phiếu
      { MaDocGia: { $in: readerIds } },          // Tìm theo list Độc giả tìm được
      { 'ChiTietMuon.MaSach': { $in: bookIds } } // Tìm theo list Sách tìm được
    ];
  }

  // --- 3. XỬ LÝ SẮP XẾP (SORT - FIX LỖI LOADING) ---
  let sortOptions = {};
  if (sortBy) {
    // Vue Good Table gửi: type = 'asc' hoặc 'desc'
    const sortDirection = sortType === 'asc' ? 1 : -1;
    
    // Mapping tên trường Frontend -> Backend
    switch (sortBy) {
        case 'MaMuonSach': sortOptions = { MaMuonSach: sortDirection }; break;
        case 'NgayMuon': sortOptions = { NgayMuon: sortDirection }; break;
        case 'NgayTraDuKien': sortOptions = { NgayTraDuKien: sortDirection }; break;
        case 'NgayTraThucTe': sortOptions = { NgayTraThucTe: sortDirection }; break;
        case 'status': sortOptions = { status: sortDirection }; break;
        default: sortOptions = { createdAt: -1 }; // Fallback
    }
  } else {
    sortOptions = { createdAt: -1 }; // Mặc định mới nhất lên đầu
  }

  // --- 4. QUERY DATABASE ---
  const count = await TheoDoiMuonSach.countDocuments(filter);
  
  const records = await TheoDoiMuonSach.find(filter)
    .populate('MaDocGia', 'MaDocGia HoLot Ten')       
    .populate('ChiTietMuon.MaSach', 'MaSach TenSach') 
    .sort(sortOptions) // <--- Áp dụng sort ở đây
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).json({
    success: true,
    records,      // Data
    total: count, // Tổng số dòng (quan trọng cho phân trang)
    page,
    pages: Math.ceil(count / limit)
  });
});


/**
 * @desc    Admin manually marks a borrow record as returned
 * @route   PUT /api/admin/muon/:id/return
 * @access  Private (Admin/Librarian)
 */
const adminReturnBook = asyncHandler(async (req, res) => {
    // This re-uses the public returnBook controller logic
    // The roleMiddleware ensures only admins can call this specific route
    // But the controller itself also checks for admin role, so it's doubly secure.
    await returnBook(req, res);
});

/**
 * @desc    Admin manually updates a borrow record
 * @route   PUT /api/admin/muon/:id
 * @access  Private (Admin/Librarian)
 */
const adminUpdateBorrow = asyncHandler(async (req, res) =>{
  await updateBorrow(req, res);
});

// --- Reports ---

/**
 * @desc    Get Hot Books report (reuse public controller)
 * @route   GET /api/admin/report/hot-books
 * @access  Private (Admin/Librarian)
 */
const getHotBooksReport = asyncHandler(async (req, res) => {
    // This just calls the same logic as the public hot books route
    await getHotBooks(req, res);
});

export {
  getDashboardStats,
  createBook,
  updateBook,
  deleteBook,
  getAllPublishers,
  createPublisher,
  updatePublisher,
  deletePublisher,
  getAllReaders,
  getReaderById,
  updateReader,
  deleteReader,
  createReader,
  getAllBorrowRecords,
  adminReturnBook,
  adminUpdateBorrow,
  getHotBooksReport,
  getTopReports
};
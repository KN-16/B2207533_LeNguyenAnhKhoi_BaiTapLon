import asyncHandler from 'express-async-handler';
import TheoDoiMuonSach from '../models/TheoDoiMuonSach.js';
import Docgia from '../models/Docgia.js';
import Counter from '../models/Counter.js';
import Sach from '../models/Sach.js';
import mongoose from 'mongoose';


/**
 * @desc    Return a book
 * @route   PUT /api/admin/muon/:id/return
 * @access  Admin
 */
const returnBook = asyncHandler(async (req, res) => {
  const { id } = req.params; // Borrow record ID
  const {ChiTietTra, GhiChu} = req.body;

  const borrowRecord = await TheoDoiMuonSach.findById(id);
  if (!borrowRecord) {
    res.status(404);
    throw new Error('Không tìm thấy phiếu mượn');
  }

  //Session for transaction
  let session = null;
  const enableTransaction = process.env.ENABLE_TRANSACTION === 'true';
  if (enableTransaction) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  try {
    // Update return details
    for (const item of ChiTietTra) {
      const borrowedItem = borrowRecord.ChiTietMuon.find(b => b.MaSach.toString() === item.MaSach);
      const book = await Sach.findById(item.MaSach).session(session);
      if (book) {
        // Update book quantity back
        book.SoQuyenConLai += item.DaTra;
        await book.save({ session });
      }
      borrowedItem.DaTra += item.DaTra;
      borrowedItem.GhiChu = item.GhiChu || borrowedItem.GhiChu;
    }

    // Set status based on returned quantities
    const allReturned = borrowRecord.ChiTietMuon.every(item => item.DaTra === item.SoLuong);
    const dateNow = new Date();
    borrowRecord.status = allReturned ? 
    (dateNow > borrowRecord.NgayTraDuKien ? 'late_returned' : 'returned') 
    : (dateNow > borrowRecord.NgayTraDuKien ? 'late' : 'partial_returned');
    if (allReturned) {
      borrowRecord.NgayTraThucTe = new Date();
    }
    borrowRecord.GhiChu = GhiChu || borrowRecord.GhiChu;
    await borrowRecord.save({ session });

    if (enableTransaction) {
      await session.commitTransaction();
    }

    res.status(200).json({
      success: true,
      message: 'Trả sách thành công',
      borrowRecord,
    });
  } catch (error) {
    if (enableTransaction) {
      await session.abortTransaction();
    }
    res.status(res.statusCode || 500);
    throw new Error(error.message || 'Trả sách thất bại');
  } finally {
    if (enableTransaction) {
      session.endSession();
    }
  }
});
  

/**
 * @desc    Get borrow records for the currently logged-in user
 * @route   GET /api/muon
 * @access  Private (Reader)
 */
const getMyBorrows = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { search, status, sortBy, sortType } = req.query;

  const userId = req.user.id;
  // --- 1. XÂY DỰNG FILTER ---
  const filter = {};
  filter.MaDocGia = userId;
  if (status) {
    filter.status = status;
  }

  // --- 2. XỬ LÝ TÌM KIẾM THÔNG MINH (SEARCH) ---
  if (search) {
    const searchRegex = { $regex: search, $options: 'i' };

    // Tìm Sách (Theo Tên hoặc Mã)
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

// POST /api/muon
const createBorrow = asyncHandler(async (req, res) => {
  const { MaDocGia, ChiTietMuon, NgayMuon, NgayTraDuKien, status, GhiChu } = req.body;

  // user
  if (await Docgia.findById(MaDocGia)===null) {
    res.status(400);
    throw new Error('Đọc giả không tồn tại');
  }

  const books=await Sach.find({_id: {$in: ChiTietMuon.map(item => item.MaSach)}});

  if (books.length !== ChiTietMuon.length) {
    res.status(400);
    throw new Error('Một hoặc nhiều sách không tồn tại');
  }

  let ChiTietMuon_hople = [];
  ChiTietMuon.forEach(item => {
    if (item.SoLuong>books.find(b => b._id.toString()===item.MaSach).SoQuyenConLai) {
      return; // Skip this item
    }
    else
    {
      item.DaTra=0; // Initialize DaTra
      ChiTietMuon_hople.push(item);
    }
  });

  if (ChiTietMuon_hople.length!==ChiTietMuon.length) {
    res.status(400);
    throw new Error('Một hoặc nhiều sách không đủ số lượng để mượn');
  }

  // Session for transaction
  let session = null;
  const enableTransaction = process.env.ENABLE_TRANSACTION === 'true';
  if (enableTransaction) {
    session = await mongoose.startSession();
    session.startTransaction();
  }
  try {
    const counter = await Counter.findOneAndUpdate(
      { model_name: 'TheoDoiMuonSach' },  // Look for counter for 'Sach' model
      { $inc: { seq: 1 } },
      { new: true, upsert: true, session }
    );

    // B. Format the ID (e.g., 1 -> "S-0001")
    // padStart(4, '0') ensures we always have 4 digits.
    const autoGeneratedMaMuonSach = `TDMS-${counter.seq.toString().padStart(4, '0')}`;
    const [borrowRecord] = await TheoDoiMuonSach.create(
      [
        {
          MaMuonSach: autoGeneratedMaMuonSach,
          MaDocGia,
          ChiTietMuon: ChiTietMuon_hople,
          NgayMuon,
          NgayTraDuKien,
          status,
          GhiChu,
        },
      ],
      { session }
    );
    
    // Decrement book quantities
    for (const item of ChiTietMuon_hople) {
        const book = books.find(b => b._id.toString()===item.MaSach);
        if (book) {
          book.SoQuyenConLai -= item.SoLuong;
          await book.save({ session });
      }
    }
    if (enableTransaction) {
      await session.commitTransaction();
    }
    res.status(201).json({
      success: true,
      message: 'Tạo phiếu mượn thành công',
      borrowRecord: borrowRecord,
    });
  } catch (error) {
    if (enableTransaction) {
      await session.abortTransaction();
    }
    res.status(res.statusCode || 500);
    throw new Error(error.message || 'Tạo phiếu mượn thất bại');
  } finally {
    if (enableTransaction) {
      session.endSession();
    }
  }
});

/**
 * @desc    Người dùng hủy phiếu mượn (Chỉ khi status = pending)
 * @route   PUT /api/muon/:id/cancel
 * @access  Private (Reader)
 */

const cancelBorrowByUser = asyncHandler(async (req, res) => {
  const borrowId = req.params.id;
  const userId = req.user.id; // Lấy từ middleware requireAuth
  const {GhiChu} = req.body;
  if (!GhiChu) {
    res.status(400);
    throw new Error('Vui lòng nhập ghi chú');
  }
  const borrow = await TheoDoiMuonSach.findOne({ 
    _id: borrowId, 
    MaDocGia: userId // Đảm bảo đúng chủ sở hữu
  }).populate('MaDocGia', 'MaDocGia Ten');

  if (!borrow) {
    res.status(404);
    throw new Error('Không tìm thấy phiếu mượn');
  }

  if (borrow.status !== 'pending') {
    res.status(400);
    throw new Error('Chỉ có thể hủy phiếu khi đang chờ duyệt');
  }

  // Logic hủy: Chuyển status thành 'cancel'
  // Lưu ý: Vì status là pending nên kho Sách CHƯA BỊ TRỪ (theo logic createBorrow của bạn: trừ ngay hay duyệt mới trừ?)
  // Dựa vào code createBorrow bạn gửi: Bạn TRỪ KHO NGAY KHI TẠO (pending).
  // => NẾU HỦY THÌ PHẢI HOÀN TRẢ KHO LẠI.
  
  let session = null;
  const enableTransaction = process.env.ENABLE_TRANSACTION === 'true';
  if (enableTransaction) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  try {
    // Hoàn trả kho
    for (const item of borrow.ChiTietMuon) {
       const book = await Sach.findById(item.MaSach).session(session);
       if (book) {
          book.SoQuyenConLai += item.SoLuong;
          await book.save({ session });
       }
    }

    borrow.status = 'cancel';
    borrow.GhiChu = GhiChu + `- ${borrow.MaDocGia.Ten}-${borrow.MaDocGia.MaDocGia} Huỷ phiếu`;
    await borrow.save({ session });

    if (enableTransaction) await session.commitTransaction();

    res.json({ success: true, message: 'Đã hủy phiếu mượn' });

  } catch (error) {
     if (enableTransaction) await session.abortTransaction();
     throw new Error('Lỗi khi hủy phiếu: ' + error.message);
  } finally {
     if (enableTransaction) session.endSession();
  }
});

// Admin

// PUT /api/admin/muon/:id, cập nhật phiếu mượn và thay đổi trạng thái
const updateBorrow = asyncHandler(async (req, res) => {
  const borrowId = req.params.id;
  const { ChiTietMuon, NgayMuon, NgayTraDuKien, status, GhiChu } = req.body;

  const borrowRecord = await TheoDoiMuonSach.findById(borrowId);
  if (!borrowRecord) {
    res.status(404);
    throw new Error('Phiếu mượn không tồn tại');
  }

  //Session for transaction
  let session = null;
  const enableTransaction = process.env.ENABLE_TRANSACTION === 'true';
  if (enableTransaction) {
    session = await mongoose.startSession();
    session.startTransaction();
  }
  try {

    // Back inventory if status changed to reject
    if (status === "reject")
    {
      for (const item of borrowRecord.ChiTietMuon) 
      {
        const book = await Sach.findById(item.MaSach).session(session);
        if (book) 
        {
          book.SoQuyenConLai += (item.SoLuong - item.DaTra);
          await book.save({ session });
        }
      }
      borrowRecord.status = "reject";
      borrowRecord.GhiChu = GhiChu;
      await borrowRecord.save({ session });
      res.status(200).json({
        success: true,
        message: 'Cập nhật phiếu mượn thành công',
        borrowRecord,
      });
      if (enableTransaction) {
        await session.commitTransaction();
      }
      return;
    }
    if (ChiTietMuon) {
    const books=await Sach.find({_id: {$in: ChiTietMuon.map(item => item.MaSach)}});
    if (books.length !== ChiTietMuon.length) {
      res.status(400);
      throw new Error('Một hoặc nhiều sách không tồn tại');
    }
    let ChiTietMuon_hople = [];
    for (const item of ChiTietMuon) {
      const book_cur= await Sach.findById(item.MaSach);
      const book_borrowed=borrowRecord.ChiTietMuon.find(b => b.MaSach.toString()===item.MaSach);
      if (item.SoLuong>book_cur.SoQuyenConLai + book_borrowed?.SoLuong ){
        return; // Skip this item
      }
      else
      {
        item.DaTra=0; // Initialize DaTra
        book_cur.SoQuyenConLai -= item.SoLuong;
        book_cur.SoQuyenConLai += book_borrowed ? book_borrowed.SoLuong : 0;
        await book_cur.save({ session });
        ChiTietMuon_hople.push(item);
      }
    };
    if (ChiTietMuon_hople.length!==ChiTietMuon.length) {
      res.status(400);
      throw new Error('Một hoặc nhiều sách không đủ số lượng để mượn');
    }
    // Back inventory if some books not in New ChiTietMuon
    for (const item of borrowRecord.ChiTietMuon) 
    {
      if (!ChiTietMuon.find(b => b.MaSach.toString()===item.MaSach.toString()))
      {
        const book = await Sach.findById(item.MaSach).session(session);
        if (book) 
        {
          book.SoQuyenConLai += item.SoLuong;
          await book.save({ session });
        }
      }
    }
    borrowRecord.ChiTietMuon = ChiTietMuon_hople;
    }
    borrowRecord.status = status || borrowRecord.status;
    borrowRecord.GhiChu = GhiChu || borrowRecord.GhiChu;
    borrowRecord.NgayTraDuKien = NgayTraDuKien || borrowRecord.NgayTraDuKien;
    borrowRecord.NgayMuon = status==="borrowed" ? new Date() :( NgayMuon || borrowRecord.NgayMuon);
    await borrowRecord.save({ session });
    if (enableTransaction) {
      await session.commitTransaction();
    }
    res.status(200).json({
      success: true,
      message: 'Cập nhật phiếu mượn thành công',
      borrowRecord,
    });
  }
  catch (error) {
    if (enableTransaction) {
      await session.abortTransaction();
    }
    res.status(res.statusCode || 500);
    throw new Error(error.message || 'Cập nhật phiếu mượn thất bại');
  }
  finally {
      if (enableTransaction) {
        session.endSession();
      }}
});

export { returnBook, getMyBorrows, updateBorrow, createBorrow , cancelBorrowByUser};
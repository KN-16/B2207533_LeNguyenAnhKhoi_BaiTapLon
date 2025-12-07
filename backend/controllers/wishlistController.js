import asyncHandler from 'express-async-handler';
import DanhSachMuon from '../models/DanhSachMuon.js';
import Sach from '../models/Sach.js';
import TheoDoiMuonSach from '../models/TheoDoiMuonSach.js';
import Counter from '../models/Counter.js';
/**
 * @desc    Lấy danh sách mong muốn của User đang login
 * @route   GET /api/wishlist
 * @access  Private (Reader)
 */
const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await DanhSachMuon.findOne({ MaDocGia: req.user.id })
  .populate({
    path: 'ChiTietDanhSachMuon.MaSach',
    select: 'TenSach coverUrl MaSach SoQuyenConLai MaNXB NamXuatBan TacGia', //
    populate: {
      path: 'MaNXB',
      select: 'TenNXB DiaChi' 
    }
  });

  if (!wishlist) {
    // Nếu chưa có thì tạo mới rỗng để trả về
    wishlist = await DanhSachMuon.create({ MaDocGia: req.user.id, ChiTietDanhSachMuon: [] });
  }

  res.json({
    success: true,
    wishlist: wishlist
  });
});

/**
 * @desc    Thêm sách vào danh sách mong muốn
 * @route   POST /api/wishlist/add
 * @access  Private (Reader)
 */
const addToWishlist = asyncHandler(async (req, res) => {
  const { MaSach, SoLuong } = req.body;
  const userId = req.user.id;

  // 1. Check sách tồn tại và kho
  const book = await Sach.findById(MaSach);
  if (!book) {
    res.status(404);
    throw new Error('Sách không tồn tại');
  }
  if (book.SoQuyenConLai < SoLuong) {
    res.status(400);
    throw new Error(`Kho chỉ còn ${book.SoQuyenConLai} quyển`);
  }

  // 2. Tìm hoặc tạo Wishlist
  let wishlist = await DanhSachMuon.findOne({ MaDocGia: userId });
  if (!wishlist) {
    wishlist = new DanhSachMuon({ MaDocGia: userId, ChiTietDanhSachMuon: [] });
  }

  // 3. Kiểm tra sách đã có trong list chưa
  const itemIndex = wishlist.ChiTietDanhSachMuon.findIndex(p => p.MaSach.toString() === MaSach);

  if (itemIndex > -1) {
    // Nếu có rồi -> Update số lượng (Cộng dồn)
    let newQty = wishlist.ChiTietDanhSachMuon[itemIndex].SoLuong + SoLuong;
    // Check max stock lần nữa
    if (newQty > book.SoQuyenConLai) newQty = book.SoQuyenConLai;
    wishlist.ChiTietDanhSachMuon[itemIndex].SoLuong = newQty;
  } else {
    // Nếu chưa -> Push mới
    wishlist.ChiTietDanhSachMuon.push({ MaSach, SoLuong });
  }

  await wishlist.save();
  
  // Populate để trả về data đẹp cho Frontend cập nhật Store ngay lập tức
  await wishlist.populate({
    path: 'ChiTietDanhSachMuon.MaSach',
    select: 'TenSach coverUrl MaSach SoQuyenConLai MaNXB NamXuatBan TacGia', //
    populate: {
      path: 'MaNXB',
      select: 'TenNXB DiaChi' // 
    }
  });

  res.json({
    success: true,
    message: 'Đã thêm vào danh sách',
    wishlist
  });
});

/**
 * @desc    Cập nhật số lượng sách trong danh sách
 * @route   Put /api/wishlist/:bookId
 * @access  Private
 */
const updateQty = asyncHandler(async (req, res) => {
  const { SoLuong } = req.body;
  const bookId = req.params.bookId;
  const userId = req.user.id; 

  // 1. Validate đầu vào
  if (!SoLuong || SoLuong <= 0) {
    res.status(400);
    throw new Error('Số lượng phải lớn hơn 0');
  }
  // 2. Tìm Wishlist (Dùng await, KHÔNG dùng callback)
  // QUAN TRỌNG: Phải .populate() để lấy được thông tin 'SoQuyenConLai' từ bảng Sách
  const wishlist = await DanhSachMuon.findOne({ MaDocGia: userId })
                                     .populate('ChiTietDanhSachMuon.MaSach');

  if (!wishlist) {
    res.status(404);
    throw new Error('Không tìm thấy danh sách mượn của bạn');
  }

  // 3. Xử lý logic cập nhật
  let find_success = false;

  // Duyệt qua mảng chi tiết
  for (let item of wishlist.ChiTietDanhSachMuon) {
    // So sánh ID (chuyển về string để an toàn)
    // Lưu ý: do đã populate, item.MaSach bây giờ là Object sách, nên lấy ID phải là item.MaSach._id
    const currentBookId = item.MaSach._id.toString(); 
    
    if (currentBookId === bookId) {
      // Check tồn kho
      // Vì đã populate nên item.MaSach chứa toàn bộ info sách
      if (SoLuong > item.MaSach.SoQuyenConLai) {
        res.status(400);
        throw new Error(`Kho chỉ còn ${item.MaSach.SoQuyenConLai} quyển. Vui lòng chọn ít hơn.`);
      }

      item.SoLuong = SoLuong;
      find_success = true;
      break; // Tìm thấy rồi thì thoát vòng lặp
    }
  }

  if (!find_success) {
    res.status(404);
    throw new Error('Sách không tồn tại trong danh sách mượn này');
  }

  // 4. Lưu lại (Dùng await, KHÔNG dùng callback)
  await wishlist.save();
  await wishlist.populate({
    path: 'ChiTietDanhSachMuon.MaSach',
    select: 'TenSach coverUrl MaSach SoQuyenConLai MaNXB NamXuatBan TacGia', //
    populate: {
      path: 'MaNXB',
      select: 'TenNXB DiaChi' // 
    }
  });

  res.json({
    success: true,
    message: 'Đã cập nhật số lượng',
    wishlist
  });
});


/**
 * @desc    Xóa sách khỏi danh sách
 * @route   DELETE /api/wishlist/:bookId
 * @access  Private
 */
const removeFromWishlist = asyncHandler(async (req, res) => {
  const bookId = req.params.bookId;
  const userId = req.user.id;

  const wishlist = await DanhSachMuon.findOne({ MaDocGia: userId });
  if (wishlist) {
    wishlist.ChiTietDanhSachMuon = wishlist.ChiTietDanhSachMuon.filter(
      item => item.MaSach.toString() !== bookId
    );
    await wishlist.save();
    await wishlist.populate({
    path: 'ChiTietDanhSachMuon.MaSach',
    select: 'TenSach coverUrl MaSach SoQuyenConLai MaNXB NamXuatBan TacGia', //
    populate: {
      path: 'MaNXB',
      select: 'TenNXB DiaChi' // 
    }
  });
  }

  res.json({ success: true, message: 'Đã xóa sách khỏi danh sách', wishlist });
});

/**
 * @desc    Tạo phieu muon tu danh sach
 * @route   POST /api/wishlist/muon
 * @access  Private
 */
const createBorrowFromWishlist = async (req, res) => {
    const userId = req.user.id; // Lấy từ middleware auth
    const { selectedBookIds, ngayMuon, ngayTraDuKien } = req.body;

    // 1. Lấy Wishlist hiện tại của user
    const wishlist = await DanhSachMuon.findOne({ MaDocGia: userId }).populate('ChiTietDanhSachMuon.MaSach');
    
    if (!wishlist) {
        return res.status(404).json({ message: "Không tìm thấy danh sách mong muốn" });
    }

    // 2. Lọc ra các sách user đã chọn để mượn
    const itemsToBorrow = wishlist.ChiTietDanhSachMuon.filter(item => 
        selectedBookIds.includes(item.MaSach._id.toString())
    );

    if (itemsToBorrow.length !== selectedBookIds.length) {
        return res.status(400).json({ message: "Số lượng sách khóng hợp lệ" });
    }
    
    // 3. Kiểm tra tồn kho lần cuối (QUAN TRỌNG)
    const itemsValidated = [];
    for (const item of itemsToBorrow) {
        const bookInDb = await Sach.findById(item.MaSach._id);
        if (!bookInDb || bookInDb.SoQuyenConLai < item.SoLuong) {
            return res.status(400).json({ 
                message: `Sách "${bookInDb?.TenSach || 'Unknown'}" không đủ số lượng trong kho.` 
            });
        }
        // Chuẩn bị item cho phiếu mượn
        itemsValidated.push({
            MaSach: item.MaSach._id,
            SoLuong: item.SoLuong,
            GhiChu: '',
            DaTra: 0
        });
    }
    if (itemsValidated.length !== itemsToBorrow.length) {
        return res.status(400).json({ message: "Số lượng sách không hợp lệ" });
    }
    // Active session for transaction
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
    // 5. Tạo phiếu mượn (Status luôn là pending)
    TheoDoiMuonSach.create(
        [
            {
                MaMuonSach: autoGeneratedMaMuonSach,
                MaDocGia: userId,
                ChiTietMuon: itemsValidated,
                NgayMuon: ngayMuon,
                NgayTraDuKien: ngayTraDuKien,
                status: 'pending',
                GhiChu: '',
            },
        ],
        { session }
    );
    
    // 6a. Trừ tồn kho
    for (const item of itemsValidated) {
        await Sach.findByIdAndUpdate(item.MaSach, {
            $inc: { SoQuyenConLai: -item.SoLuong }
        }, { session });
    }

    // 6b. Xóa sách đã mượn khỏi Wishlist
    const newWishlist = await DanhSachMuon.findOneAndUpdate(
        { MaDocGia: userId },
        { $pull: { ChiTietDanhSachMuon: { MaSach: { $in: selectedBookIds } } } },
        { session }
    ).populate({
    path: 'ChiTietDanhSachMuon.MaSach',
    select: 'TenSach coverUrl MaSach SoQuyenConLai MaNXB NamXuatBan TacGia', //
    populate: {
      path: 'MaNXB',
      select: 'TenNXB DiaChi' // 
    }
  });

    res.status(201).json({ 
        success: true, 
        message: "Đăng ký mượn thành công! Vui lòng chờ duyệt.",
        wishlist: newWishlist
    });

    if (enableTransaction) {
        await session.commitTransaction();
    }
} catch (error) {
    if (enableTransaction) {
        await session.abortTransaction();
    }
    console.error("Borrow Wishlist Error:", error);
    res.status(500).json({ message: "Lỗi server khi xử lý mượn sách" });
}
finally {
    if (enableTransaction) {
        session.endSession();
    }
}
};

export { getWishlist, addToWishlist, removeFromWishlist, createBorrowFromWishlist, updateQty };
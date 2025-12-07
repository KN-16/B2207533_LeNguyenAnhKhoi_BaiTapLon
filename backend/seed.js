import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Import Models (Giả sử file seed.js nằm cùng cấp với folder models hoặc điều chỉnh path phù hợp)
import Docgia from './models/Docgia.js';
import NhanVien from './models/NhanVien.js';
import NhaXuatBan from './models/NhaXuatBan.js';
import Sach from './models/Sach.js';
import TheoDoiMuonSach from './models/TheoDoiMuonSach.js';
import Counter from './models/Counter.js';

dotenv.config();

// --- CẤU HÌNH KẾT NỐI ---
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// --- HÀM HELPER GEN ID ---
// Hàm này giúp tạo ID dạng chuỗi (ví dụ: 1 -> "0001")
const padId = (num) => String(num).padStart(4, '0');

// --- DỮ LIỆU MẪU ---
const sampleAuthors = [
  "Nguyễn Nhật Ánh", "Tô Hoài", "Nam Cao", "J.K. Rowling", 
  "Haruki Murakami", "Stephen King", "Agatha Christie", "Paulo Coelho"
];

const bookTitles = [
  "Mắt Biếc", "Dế Mèn Phiêu Lưu Ký", "Chí Phèo", "Harry Potter và Hòn Đá Phù Thủy",
  "Rừng Na Uy", "IT", "Mười Người Da Đen Nhỏ", "Nhà Giả Kim",
  "Kính Vạn Hoa", "Đất Rừng Phương Nam", "Số Đỏ", "Lão Hạc",
  "Cho Tôi Xin Một Vé Đi Tuổi Thơ", "Sapiens: Lược Sử Loài Người", "Đắc Nhân Tâm"
];

// --- MAIN SEED FUNCTION ---
const seedData = async () => {
  try {
    console.log('=== BẮT ĐẦU SEED DỮ LIỆU MẪU ===');
    //Drop database old data...
    await mongoose.connection.db.dropDatabase();
    console.log('--- Đã xóa dữ liệu cũ ---');
    // // 1. CLEAR DATA
    // await Docgia.deleteMany({});
    // await NhanVien.deleteMany({});
    // await NhaXuatBan.deleteMany({});
    // await Sach.deleteMany({});
    // await TheoDoiMuonSach.deleteMany({});
    // await Counter.deleteMany({});

    // console.log('--- Đã xóa dữ liệu cũ ---');

    // 2. TẠO COUNTER (Để app chạy tiếp tục đúng ID)
    // Chúng ta sẽ set seq bằng số lượng record sẽ tạo
    const counters = [
      { model_name: 'Docgia', seq: 6 },
      { model_name: 'NhanVien', seq: 2 },
      { model_name: 'NhaXuatBan', seq: 6 },
      { model_name: 'Sach', seq: 15 },
      { model_name: 'TheoDoiMuonSach', seq: 40 } // Ước lượng
    ];
    await Counter.insertMany(counters);

    // 3. TẠO NHÀ XUẤT BẢN (6+)
    const nxbs = [];
    for (let i = 1; i <= 6; i++) {
      nxbs.push({
        MaNXB: `NXB-${padId(i)}`,
        TenNXB: `Nhà Xuất Bản ${i === 1 ? 'Kim Đồng' : i === 2 ? 'Trẻ' : i === 3 ? 'Văn Học' : 'Giáo Dục ' + i}`,
        DiaChi: `Địa chỉ NXB số ${i}, Quận ${i}, TP.HCM`
      });
    }
    const createdNXBs = await NhaXuatBan.insertMany(nxbs);
    console.log(`- Đã tạo ${createdNXBs.length} NXB`);

    // 4. TẠO SÁCH (12+)
    // Lưu ý: SoQuyenConLai ban đầu = SoQuyen. Sau này tạo phiếu mượn sẽ trừ sau.
    const books = [];
    for (let i = 1; i <= 15; i++) {
      const randomNXB = createdNXBs[Math.floor(Math.random() * createdNXBs.length)];
      const randomAuthor = sampleAuthors[Math.floor(Math.random() * sampleAuthors.length)];
      
      books.push({
        MaSach: `S-${padId(i)}`,
        TenSach: bookTitles[i-1] || `Sách Mẫu ${i}`,
        SoQuyen: 20, // Set nhiều để đủ test mượn
        SoQuyenConLai: 20, // Default ban đầu
        NamXuatBan: 2010 + Math.floor(Math.random() * 14),
        MaNXB: randomNXB._id,
        TacGia: [randomAuthor],
        coverUrl: null, // Default
        tags: ["Văn học", "Tiểu thuyết", "Kinh điển"],
        pinnedHot: Math.random() < 0.3 // 30% cơ hội là sách Hot
      });
    }
    const createdBooks = await Sach.insertMany(books);
    console.log(`- Đã tạo ${createdBooks.length} Sách`);

    // 5. TẠO NHÂN VIÊN (2 người)
    // Password hash thủ công hoặc thông qua model.create để kích hoạt pre-save hook
    // Tuy nhiên insertMany không kích hoạt pre-save hook ở một số version, nên ta dùng vòng lặp create cho chắc.
    // User Admin 1
    await NhanVien.create({
      MSNV: `MSNV-${padId(1)}`,
      username: 'nguyenkhoi_testadmin',
      passwordHash: 'adminpass', // Hook sẽ hash cái này
      HoLot: 'Nguyễn',
      Ten: 'Khôi',
      email: 'khoiadmin@library.com',
      role: 'admin',
      DiaChi: 'TP.HCM',
      DienThoai: '0909000001'
    });

    // User Admin 2
    await NhanVien.create({
      MSNV: `MSNV-${padId(2)}`,
      username: 'staff_02',
      passwordHash: '123456',
      HoLot: 'Trần',
      Ten: 'Bảo',
      email: 'staff02@library.com',
      role: 'admin',
      DiaChi: 'Hà Nội',
      DienThoai: '0909000002'
    });
    console.log(`- Đã tạo 2 Nhân viên (Admin)`);
    // 6. TẠO Đọc GIẢ (6 người)
    const docgias = [];
    for (let i = 1; i <= 6; i++) {
      await Docgia.create({
        MaDocGia: `DG-${padId(i)}`,
        username: `user${i}`,
        passwordHash: '123456',
        HoLot: 'Đọc giả',
        Ten: `Số ${i}`,
        email: `user${i}@gmail.com`,
        Phai: i % 2 === 0 ? 'Nữ' : 'Nam',
        DiaChi: 'Việt Nam',
        DienThoai: `098765432${i}`
      });
    }
    // Lấy lại danh sách đọc giả để dùng ID
    const createdDocgias = await Docgia.find({});
    console.log(`- Đã tạo ${createdDocgias.length} Đọc giả`);

    // 7. TẠO PHIẾU MƯỢN (Quan trọng)
    // Các status: 'pending', 'borrowed', 'returned', 'late', 'late_returned', 'reject', 'partial_returned', 'cancel'
    const statuses = ['pending', 'borrowed', 'returned', 'late', 'late_returned', 'reject', 'partial_returned', 'cancel'];
    let borrowCounter = 1;

    for (const status of statuses) {
      // Mỗi status tạo 4 phiếu
      for (let k = 0; k < 4; k++) {
        const randomUser = createdDocgias[Math.floor(Math.random() * createdDocgias.length)];
        
        // Chọn ngẫu nhiên 1-2 sách cho mỗi phiếu
        const numBooks = Math.floor(Math.random() * 2) + 1;
        const selectedBooks = [];
        
        // Shuffle sách để lấy random
        const shuffledBooks = createdBooks.sort(() => 0.5 - Math.random()).slice(0, numBooks);

        // Tính toán ngày tháng dựa trên status
        const today = new Date();
        let ngayMuon = new Date();
        let ngayTraDuKien = new Date();
        let ngayTraThucTe = null;
        let ghiChu = "";

        // Logic ngày tháng
        switch (status) {
          case 'pending': // Mới đặt, chưa duyệt
            ngayMuon = new Date();
            ngayTraDuKien.setDate(today.getDate() + 7);
            break;
          case 'borrowed': // Đang mượn, chưa đến hạn
            ngayMuon.setDate(today.getDate() - 2);
            ngayTraDuKien.setDate(today.getDate() + 5);
            break;
          case 'returned': // Đã trả đúng hạn
            ngayMuon.setDate(today.getDate() - 10);
            ngayTraDuKien.setDate(today.getDate() - 3);
            ngayTraThucTe = new Date();
            ngayTraThucTe.setDate(today.getDate() - 4); // Trả trước hạn 1 ngày
            break;
          case 'late': // Trễ hạn, chưa trả
            ngayMuon.setDate(today.getDate() - 15);
            ngayTraDuKien.setDate(today.getDate() - 5); // Đã qua hạn 5 ngày
            break;
          case 'late_returned': // Đã trả nhưng trễ
            ngayMuon.setDate(today.getDate() - 20);
            ngayTraDuKien.setDate(today.getDate() - 10);
            ngayTraThucTe = new Date(); // Trả hôm nay (trễ)
            break;
          case 'reject': // Từ chối
            ngayMuon = new Date();
            ngayTraDuKien.setDate(today.getDate() + 7);
            ghiChu = "Tài khoản đang bị khóa, không thể mượn.";
            break;
          case 'cancel': // Hủy
            ngayMuon = new Date();
            ngayTraDuKien.setDate(today.getDate() + 7);
            ghiChu = "Đổi ý không mượn nữa.";
            break;
          case 'partial_returned': // Trả 1 phần (sẽ xử lý logic DaTra bên dưới)
            ngayMuon.setDate(today.getDate() - 5);
            ngayTraDuKien.setDate(today.getDate() + 2);
            break;
        }

        // Xử lý chi tiết mượn và Update kho
        const chiTietMuon = [];
        
        for (const book of shuffledBooks) {
          const soLuongMuon = 2; // Mặc định mượn 2 cuốn cho dễ test partial
          let daTra = 0;

          // Logic DaTra dựa trên status
          if (['pending', 'borrowed', 'late', 'reject', 'cancel'].includes(status)) {
            daTra = 0;
          } else if (['returned', 'late_returned'].includes(status)) {
            daTra = soLuongMuon; // Trả đủ
          } else if (status === 'partial_returned') {
            daTra = 1; // Mượn 2 trả 1
          }

          chiTietMuon.push({
            MaSach: book._id,
            SoLuong: soLuongMuon,
            GhiChu: status === 'partial_returned' ? 'Mới trả được 1 cuốn' : '',
            DaTra: daTra
          });

          // --- LOGIC TRỪ KHO QUAN TRỌNG ---
          // Kho (SoQuyenConLai) chỉ bị trừ khi sách đang "ở ngoài" (pending, borrowed, late, partial)
          // reject, cancel, returned (đủ) thì coi như sách đã về kho (hoặc chưa từng đi)
          
          let soLuongDangMuon = 0;
          
          if (['pending', 'borrowed', 'late'].includes(status)) {
            soLuongDangMuon = soLuongMuon;
          } else if (status === 'partial_returned') {
            soLuongDangMuon = soLuongMuon - daTra;
          }
          // reject, cancel, returned, late_returned: soLuongDangMuon = 0

          if (soLuongDangMuon > 0) {
            await Sach.findByIdAndUpdate(book._id, {
              $inc: { SoQuyenConLai: -soLuongDangMuon }
            });
          }
        }

        // Tạo phiếu
        await TheoDoiMuonSach.create({
          MaMuonSach: `TDMS-${padId(borrowCounter++)}`,
          MaDocGia: randomUser._id,
          ChiTietMuon: chiTietMuon,
          NgayMuon: ngayMuon,
          NgayTraDuKien: ngayTraDuKien,
          NgayTraThucTe: ngayTraThucTe,
          status: status,
          GhiChu: ghiChu
        });
      }
    }
    console.log(`- Đã tạo ${borrowCounter - 1} Phiếu mượn (đủ các trạng thái)`);
    console.log(`- Đã cập nhật SoQuyenConLai cho các sách tương ứng`);

    // Update lại Counter phiếu mượn cho chuẩn
    await Counter.findOneAndUpdate({ model_name: 'TheoDoiMuonSach' }, { seq: borrowCounter });

    console.log('=== SEED DATA SUCCESSFULLY ===');
    process.exit();

  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

// Chạy hàm seed
connectDB().then(() => {
  seedData();
});
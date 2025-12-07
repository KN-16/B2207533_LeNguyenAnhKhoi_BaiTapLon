import mongoose from 'mongoose';

const theoDoiMuonSachSchema = new mongoose.Schema(
  {
    MaMuonSach:
    {
      type: String,
      required: true,
      unique: true,
    },
    MaDocGia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Docgia',
      required: true,
    },
    ChiTietMuon: [
    {
      MaSach: { type: mongoose.Schema.Types.ObjectId, ref: 'Sach', required: true },
      SoLuong: { type: Number, required: true, min: 1 },
      GhiChu: String, // Tình trạng sách lúc mượn (Rách, mới...)
      DaTra: { type: Number, default: 0 } // Để quản lý trả từng phần (Trả 1 cuốn giữ lại 1 cuốn)
    }
    ],
    NgayMuon: {
      type: Date,
      default: Date.now,
    },
    NgayTraDuKien: {
      type: Date,
      required: true,
    },
    NgayTraThucTe: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'borrowed', 'returned', 'late','late_returned' ,'reject', 'partial_returned', 'cancel'], //Cancer and Pending for readers to cancel or wait for approval
      default: 'borrowed', // Assuming admin approval is not needed, or set to 'pending' if it is
    },
    GhiChu: { type: String, default: '' }, // Ghi chú chung cho phiếu mượn
    },
    {
    timestamps: true,
    },);

// Index to find active borrows by a user for a specific book
theoDoiMuonSachSchema.index({ MaDocGia: 1, status: 1 });
theoDoiMuonSachSchema.index({ "ChiTietMuon.MaSach": 1 });

const TheoDoiMuonSach = mongoose.model(
  'TheoDoiMuonSach',
  theoDoiMuonSachSchema
);
export default TheoDoiMuonSach;
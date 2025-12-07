import mongoose from 'mongoose';

const danhSachMuonSchema = new mongoose.Schema({
  MaDocGia: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Docgia', 
    required: true, 
    unique: true // Mỗi user chỉ có 1 danh sách mượn
  },
  ChiTietDanhSachMuon: [
    {
      MaSach: { type: mongoose.Schema.Types.ObjectId, ref: 'Sach', required: true },
      SoLuong: { type: Number, required: true, min: 1 },
    }
  ]
}, { timestamps: true });

const DanhSachMuon = mongoose.model('DanhSachMuon', danhSachMuonSchema);
export default DanhSachMuon;
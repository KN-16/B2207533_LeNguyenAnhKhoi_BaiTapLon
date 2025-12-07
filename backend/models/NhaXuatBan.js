import mongoose from 'mongoose';

const nhaXuatBanSchema = new mongoose.Schema(
  {
    MaNXB: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    TenNXB: {
      type: String,
      required: true,
    },
    DiaChi: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const NhaXuatBan = mongoose.model('NhaXuatBan', nhaXuatBanSchema);
export default NhaXuatBan;
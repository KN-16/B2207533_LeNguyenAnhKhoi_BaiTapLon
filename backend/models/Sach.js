import mongoose from 'mongoose';
import TheoDoiMuonSach from './TheoDoiMuonSach.js';

const sachSchema = new mongoose.Schema(
  {
    MaSach: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    TenSach: {
      type: String,
      required: true,
    },
    SoQuyen: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    SoQuyenConLai: {
      type: Number,
      required: true,
      min: 0,
      default: function() { return this.SoQuyen; },
    },
    NamXuatBan: {
      type: Number,
      required: true,
    },
    MaNXB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NhaXuatBan',
      required: true,
    },
    TacGia: {
      type: [String],
      default: [],
    },
    coverUrl: {
      type: String,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    pinnedHot: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for searching by name and author
sachSchema.index({ TenSach: 'text', TacGia: 'text' });

const Sach = mongoose.model('Sach', sachSchema);
export default Sach;
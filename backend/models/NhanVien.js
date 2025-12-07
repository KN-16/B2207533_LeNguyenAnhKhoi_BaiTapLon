import mongoose from 'mongoose';
import bcrypt from 'bcrypt';


const nhanVienSchema = new mongoose.Schema(
  {
    MSNV: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    HoLot: {
      type: String,
      required: true,
      trim: true,
    },
    Ten: {
      type: String,
      required: true,
      trim: true,
    },
    NgaySinh: {
      type: Date,
    },
    Phai: {
      type: String,
      enum: ['Nam', 'Nữ', 'Khác'],
    },
    DiaChi: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    DienThoai: {
      type: String,
    },
    role: {
      type: String,
      required: true,
      enum: ['admin'],
      default: 'admin',
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual for full name
nhanVienSchema.virtual('fullName').get(function () {
  return `${this.HoLot} ${this.Ten}`;
});

// Hash password before saving
nhanVienSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Method to compare passwords
nhanVienSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

const NhanVien = mongoose.model('NhanVien', nhanVienSchema);
export default NhanVien;
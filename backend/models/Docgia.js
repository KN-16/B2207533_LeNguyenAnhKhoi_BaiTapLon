import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const docgiaSchema = new mongoose.Schema(
  {
    MaDocGia: {
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
    },
    Ten: {
      type: String,
      required: true,
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
      default: 'reader',
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Virtual for full name
docgiaSchema.virtual('fullName').get(function () {
  return `${this.HoLot} ${this.Ten}`;
});

// Hash password before saving
docgiaSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Method to compare passwords
docgiaSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

const Docgia = mongoose.model('Docgia', docgiaSchema);
export default Docgia;
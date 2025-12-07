// models/Counter.js
import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  model_name: { type: String, required: true, unique: true }, // Name of the model (e.g., 'Sach')
  seq: { type: Number, default: 0 }      // Stores the current count
});
const Counter = mongoose.model('Counter', counterSchema);
export default Counter;
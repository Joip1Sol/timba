import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  credits: {
    type: Number,
    default: 1000 // Créditos iniciales
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

export const User = mongoose.model('User', userSchema); 
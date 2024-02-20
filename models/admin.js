// admin.js - admin model
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  role: { type: String, default: 'admin' },
  // Add other fields as needed
});

// Hash the plain text password before saving
adminSchema.pre('save', async function (next) {
  const admin = this;

  if (admin.isModified('password')) {
    admin.password = await bcrypt.hash(admin.password, 8);
  }

  next();
});

// Generate an authentication token for the admin
adminSchema.methods.generateAuthToken = async function () {
  const admin = this;
  const token = jwt.sign({ _id: admin._id }, config.adminSecretKey, { expiresIn: '1h' });

  admin.tokens = [{ token }]; // Store only the latest token
  await admin.save();

  return token;
};

// Find admin by email and password
adminSchema.statics.findByCredentials = async (email, password) => {
  const admin = await Admin.findOne({ email });

  if (!admin) {
    throw new Error('Invalid credentials');
  }

  const isPasswordMatch = await bcrypt.compare(password, admin.password);

  if (!isPasswordMatch) {
    throw new Error('Invalid credentials');
  }

  return admin;
};

// Add a method to compare passwords
adminSchema.statics.comparePassword = async function(candidatePassword, hashedPassword) {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};
const Admin = mongoose.model('Admin', adminSchema);

export default Admin;

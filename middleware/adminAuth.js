import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import Admin from '../models/admin.js';

export default async function (req, res, next) {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized', data: null, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.adminSecretKey);

    const admin = await Admin.findOne({ _id: decoded.adminId });

    if (!admin) {
      throw new Error('Admin not found');
    }

    req.admin = admin;
    req.token = token;
    next();
  } catch (error) {
    console.log('Error:', error);
    res.status(401).json({ success: false, error: 'Unauthorized', data: null, message: error.message });
  }
}

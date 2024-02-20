import jwt from 'jsonwebtoken';
import Member from '../models/member.js';
import config from '../config/config.js';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized', data: null, message: 'Please provide a token' });
    }

    const decoded = jwt.verify(token, config.memberSecretKey);

    const member = await Member.findOne({ _id: decoded.memberId });

    console.log(decoded);
    if (!member) {
      throw new Error('Member not found');
    }

    req.member = member;
    req.token = token;
    next();
  } catch (error) {
    console.log('Error:', error);
    res.status(401).json({ success: false, error: 'Unauthorized', data: null, message: 'Please authenticate as a member.' });
  }
};

export default auth;

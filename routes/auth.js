// auth.js - auth routes
import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/admin.js';
import Member from '../models/member.js';
import OwnerChangeRequest from "../models/OwnerChangeRequestSchema.js";
import config from '../config/config.js';
import Horse from '../models/horse.js';
import auth from '../middleware/auth.js';
import path from 'path';

const router = express.Router();

// Route for horse search with pagination, including member information
router.get('/horses/search', auth, async (req, res) => {
  try {
    const { query } = req.query; // Search query provided by the client
    const regex = new RegExp(query, 'i'); // Case-insensitive regex for partial matching

    // Extract query parameters for pagination (itemsPerPage and pageNo)
    let { itemsPerPage = 10, pageNo = 1 } = req.query;
    itemsPerPage = parseInt(itemsPerPage);
    pageNo = parseInt(pageNo);

    // Calculate the skip value for pagination
    const skip = (pageNo - 1) * itemsPerPage;

    // MongoDB query to find horses matching the name or registration number with pagination and approvalStatus filter
    const count = await Horse.countDocuments({
      $and: [
        { $or: [
          { name: { $regex: regex } }, // Match horse name
          { registrationNum: { $regex: regex } } // Match registration number
        ]},
        { approvalStatus: 'approved' } // Filter by approved status
      ]
    });
    const horses = await Horse.find({
      $and: [
        { $or: [
          { name: { $regex: regex } }, // Match horse name
          { registrationNum: { $regex: regex } } // Match registration number
        ]},
        { approvalStatus: 'approved' } // Filter by approved status
      ]
    })
    .populate('owner', 'firstName lastName state country') // Populate owner field with specified fields
    .skip(skip)
    .limit(itemsPerPage);

    // Send response with the paginated list of approved horses and pagination info
    const totalPages = Math.ceil(count / itemsPerPage);
    res.status(200).json({ 
      success: true, 
      data: horses, 
      pagination: {
        currentPage: pageNo,
        itemsPerPage: itemsPerPage,
        totalItems: count,
        totalPages: totalPages
      },
      message: 'Approved horses retrieved successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message, 
      data: null, 
      message: 'Internal Server Error' 
    });
  }
});



// Route to list all approved horses owned by a member with pagination
router.get('/horses', auth, async (req, res) => {
  try {
    // Retrieve the member's ID from the authenticated request
    const memberId = req.member._id;

    // Extract query parameters for pagination (itemsPerPage and pageNo)
    let { itemsPerPage = 10, pageNo = 1 } = req.query;
    itemsPerPage = parseInt(itemsPerPage);
    pageNo = parseInt(pageNo);

    // Calculate the skip value for pagination
    const skip = (pageNo - 1) * itemsPerPage;

    // Query the database for approved horses owned by the member with pagination
    const count = await Horse.countDocuments({ owner: memberId, approvalStatus: 'approved' });
    const horses = await Horse.find({ owner: memberId, approvalStatus: 'approved' })
                                .skip(skip)
                                .limit(itemsPerPage);

    // Send response with the paginated list of horses and pagination info
    const totalPages = Math.ceil(count / itemsPerPage);
    res.status(200).json({ 
      success: true, 
      data: horses, 
      pagination: {
        currentPage: pageNo,
        itemsPerPage: itemsPerPage,
        totalItems: count,
        totalPages: totalPages
      },
      message: 'List of approved horses owned by the member' 
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({ 
      success: false, 
      error: error.message, 
      message: 'Internal Server Error' 
    });
  }
});

// Member login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body; // Destructure email and password from request body

    // Check if email is provided
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required', data: null, message: 'Email is required' });
    }

    const member = await Member.findOne({ email }); // Find member by email

    if (!member || !(await member.comparePassword(password, member.password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials', data: null, message: 'Authentication failed' });
    }

    if (!member.isPaid) {
      return res.status(403).json({ success: false, error: 'Membership fee not paid', data: null, message: 'Membership fee not paid' });
    }

    if (!member.isActive) {
      return res.status(403).json({ success: false, error: 'Member is deactivated', data: null, message: 'Member is deactivated' });
    }

    const token = jwt.sign({ memberId: member._id, role: 'member' }, config.memberSecretKey, { expiresIn: '1h' });

    // Exclude sensitive data like password from the response
    let memberInfo = member;
    memberInfo.password = undefined;
    memberInfo.tokens = undefined;
    res.status(200).json({ success: true, data: { token,  member: member }, error: null, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, data: null, message: 'Internal Server Error' });
  }
});




// Admin login route
router.post('/admin-login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin || !(await Admin.comparePassword(password, admin.password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials', data: null, message: 'Authentication failed' });
    }

    const token = jwt.sign({ adminId: admin._id, role: 'admin' }, config.adminSecretKey, { expiresIn: '1h' });
    res.status(200).json({ success: true, data: { token, role: 'admin' }, error: null, message: 'Admin login successful' }); // Include token in the response data
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, data: null, message: 'Internal Server Error' });
  }
});

// Route to fetch pending or registered horse profiles for authenticated member with pagination
router.get('/pending-horses', auth, async (req, res) => {
  try {
    // Retrieve the authenticated member's ID from the request
    const memberId = req.member._id;

    // Extract query parameters for pagination (itemsPerPage and pageNo)
    let { itemsPerPage = 10, pageNo = 1 } = req.query;
    itemsPerPage = parseInt(itemsPerPage);
    pageNo = parseInt(pageNo);

    // Calculate the skip value for pagination
    const skip = (pageNo - 1) * itemsPerPage;

    // Find all horses belonging to the member with pending or registered status with pagination
    const count = await Horse.countDocuments({ owner: memberId, approvalStatus: { $in: ['pending', 'registered'] } });
    const pendingHorses = await Horse.find({ owner: memberId, approvalStatus: { $in: ['pending', 'registered'] } })
                                      .skip(skip)
                                      .limit(itemsPerPage);

    // Map over the pending horses to convert the buffer to base64
    const horsesWithBase64Docs = pendingHorses.map(horse => ({
      ...horse._doc,
      registrationDocumentURL: horse.registrationDocument ? `/uploads/${path.basename(horse.registrationDocument)}` : null,
      dnaKitDocumentURL: horse.dnaKitDocument ? `/uploads/${path.basename(horse.dnaKitDocument)}` : null,
    }));

    // Send response with the paginated list of pending or registered horse profiles and pagination info
    const totalPages = Math.ceil(count / itemsPerPage);
    res.status(200).json({ 
      success: true, 
      data: horsesWithBase64Docs, 
      pagination: {
        currentPage: pageNo,
        itemsPerPage: itemsPerPage,
        totalItems: count,
        totalPages: totalPages
      },
      error: null, 
      message: 'Pending or registered horse profiles retrieved successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      data: null, 
      error: error.message, 
      message: 'Internal Server Error' 
    });
  }
});


// Route for a member to request a change in horse owner
router.post('/request-owner-change', auth, async (req, res) => {
  try {
    // Extract required data from request body
    const { horseId, newOwnerId } = req.body;
    const memberId = req.member._id;

    // Find the horse by ID
    const horse = await Horse.findById(horseId);

    // Check if horse exists
    if (!horse) {
      return res.status(404).json({ success: false, data: null, error: 'Horse not found', message: 'Horse not found' });
    }

    // Check if the requesting member is the current owner of the horse
    if (horse.owner.toString() !== memberId.toString()) {
      return res.status(403).json({ success: false, data: null, error: 'Unauthorized', message: 'You are not the owner of this horse' });
    }

    // Find the new owner by ID
    const newOwner = await Member.findById(newOwnerId);

    // Check if new owner exists
    if (!newOwner) {
      return res.status(404).json({ success: false, data: null, error: 'New owner not found', message: 'New owner not found' });
    }

    // Update the horse's owner ID and owner name
    horse.owner = newOwnerId;
    horse.ownerName = `${newOwner.firstName} ${newOwner.lastName}`; 

    // Save the updated horse data
    await horse.save();

    // Create a new owner change request
    const ownerChangeRequest = new OwnerChangeRequest({
      horse: horseId,
      currentOwner: memberId,
      newOwner: newOwnerId,
      status: 'pending' // Initial status of the request
    });
    await ownerChangeRequest.save();

    res.status(201).json({
      success: true,
      data: ownerChangeRequest,
      error: null,
      message: 'Owner change request created successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message, message: 'Internal Server Error' });
  }
});


export default router;

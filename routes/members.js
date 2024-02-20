// members.js - member routes
import express from 'express';
import Member from '../models/member.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Create member profile
router.post('/', async (req, res) => {
  try {
    const newMember = await Member.create(req.body);
    res.status(201).json({ success: true, data: newMember, error: null, message: 'Member profile created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message, message: 'Internal Server Error' });
  }
});

// Member login
router.post('/login', async (req, res) => {
  try {
    const member = await Member.findByCredentials(req.body.email, req.body.password);
    const token = await member.generateAuthToken();
    res.status(200).json({ success: true, data: { member, token }, error: null, message: 'Login successful' });
  } catch (error) {
    res.status(401).json({ success: false, data: null, error: error.message, message: 'Authentication failed' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    // Extract query parameters for pagination (itemsPerPage and pageNo)
    let { itemsPerPage = 10, pageNo = 1 } = req.query;
    itemsPerPage = parseInt(itemsPerPage);
    pageNo = parseInt(pageNo);

    // Calculate the skip value for pagination
    const skip = (pageNo - 1) * itemsPerPage;

    // Find all members with pagination
    const count = await Member.countDocuments();
    const members = await Member.find()
                                .skip(skip)
                                .limit(itemsPerPage);

    // Send response with the paginated list of members and pagination info
    const totalPages = Math.ceil(count / itemsPerPage);
    res.status(200).json({ 
      success: true, 
      data: members, 
      pagination: {
        currentPage: pageNo,
        itemsPerPage: itemsPerPage,
        totalItems: count,
        totalPages: totalPages
      },
      error: null, 
      message: 'Members retrieved successfully' 
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


// Get member by ID
router.get('/:id', async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    res.status(200).json({ success: true, data: member, error: null, message: 'Member retrieved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message, message: 'Internal Server Error' });
  }
});

// Update member by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedMember = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: updatedMember, error: null, message: 'Member updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message, message: 'Internal Server Error' });
  }
});

// Delete member by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedMember = await Member.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: deletedMember, error: null, message: 'Member deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message, message: 'Internal Server Error' });
  }
});

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

    // Find member by ID and populate pending horses with pagination
    const member = await Member.findById(memberId).populate({
      path: 'pendingHorses',
      options: {
        skip: skip,
        limit: itemsPerPage
      }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Member not found',
        message: 'Member not found'
      });
    }

    // Count total pending horses
    const totalItems = member.pendingHorses.length;

    // Slice the pendingHorses array based on pagination
    const paginatedHorses = member.pendingHorses.slice(skip, skip + itemsPerPage);

    // Send response with the paginated list of pending horses and pagination info
    res.status(200).json({
      success: true,
      data: paginatedHorses,
      pagination: {
        currentPage: pageNo,
        itemsPerPage: itemsPerPage,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / itemsPerPage)
      },
      message: 'Pending horses retrieved successfully'
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


// update pending horse list

router.put('/pending-horses/:horseId', auth, async (req, res) => {
  try {
    const { horseId } = req.params;
    const memberId = req.member._id;

    // Check if the horse belongs to the member's pending list
    const member = await Member.findOne({ _id: memberId, pendingHorses: horseId });
    if (!member) {
      return res.status(404).json({ success: false, data: null, error: 'Horse not found in pending list', message: 'Horse not found in pending list' });
    }

    // Update the horse details
    const updatedHorse = await Horse.findByIdAndUpdate(horseId, req.body, { new: true });
    res.status(200).json({ success: true, data: updatedHorse, message: 'Horse updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message, message: 'Internal Server Error' });
  }
});


export default router;

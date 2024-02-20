// horses.js - horse route
import express from 'express';
import auth from '../middleware/auth.js'; // Import authentication middleware
import Horse from '../models/horse.js';
import Member from '../models/member.js';
import multer from 'multer';

const router = express.Router();

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Set destination folder for file uploads
    cb(null, 'uploads/'); // Change 'uploads/' to the desired directory
  },
  filename: (req, file, cb) => {
    // Set filename to original name
    cb(null, file.originalname);
  }
});

// Initialize multer with storage configuration
const upload = multer({ storage });

// create or register horse with documents
router.post('/', auth, upload.fields([{ name: 'registrationDocument', maxCount: 1 }, { name: 'dnaKitDocument', maxCount: 1 }]), async (req, res) => {
  try {
    const memberId = req.member._id;
    const member = await Member.findById(memberId);
    if (!member || !member.isActive) {
      return res.status(404).json({ success: false, data: null, error: 'Member not found or inactive', message: 'Member not found or inactive' });
    }

    const { pedigree, ...horseData } = req.body;

    // Check if files were uploaded
    let registrationDocumentPath;
    let dnaKitDocumentPath;
    if (req.files['registrationDocument'] && req.files['registrationDocument'][0]) {
      registrationDocumentPath = req.files['registrationDocument'][0].path; // Store file path
    }
    if (req.files['dnaKitDocument'] && req.files['dnaKitDocument'][0]) {
      dnaKitDocumentPath = req.files['dnaKitDocument'][0].path; // Store file path
    }

    const newHorse = await Horse.create({
      ...horseData,
      owner: memberId,
      pedigree,
      registrationDocument: registrationDocumentPath, // Save file path
      dnaKitDocument: dnaKitDocumentPath // Save file path
    });

    member.pendingHorses.push(newHorse._id);
    await member.save();

    res.status(201).json({ success: true, data: newHorse, error: null, message: 'Horse profile created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message, message: 'Internal Server Error' });
  }
});




router.get('/', async (req, res) => {
  try {
    // Extract query parameters for pagination (itemsPerPage and pageNo)
    let { itemsPerPage = 10, pageNo = 1 } = req.query;
    itemsPerPage = parseInt(itemsPerPage);
    pageNo = parseInt(pageNo);

    // Calculate the skip value for pagination
    const skip = (pageNo - 1) * itemsPerPage;

    // Find all horses with pagination
    const count = await Horse.countDocuments();
    const horses = await Horse.find()
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
      error: null, 
      message: 'Horses retrieved successfully' 
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


router.get('/member', auth, async (req, res) => {
  try {
    // Retrieve the authenticated member's ID from the request
    const memberId = req.member._id;

    // Extract query parameters for pagination (itemsPerPage and pageNo)
    let { itemsPerPage = 10, pageNo = 1 } = req.query;
    itemsPerPage = parseInt(itemsPerPage);
    pageNo = parseInt(pageNo);

    // Calculate the skip value for pagination
    const skip = (pageNo - 1) * itemsPerPage;

    // Find horses belonging to the member with pagination
    const count = await Horse.countDocuments({ owner: memberId });
    const horses = await Horse.find({ owner: memberId })
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
      error: null, 
      message: 'Member horses retrieved successfully' 
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


router.get('/:id', async (req, res) => {
  try {
    // Find horse by ID
    const horse = await Horse.findById(req.params.id);
    res.status(200).json({ 
      success: true, 
      data: horse, 
      error: null, 
      message: 'Horse retrieved successfully' 
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


// Update horse by ID
router.put('/:id', auth, async (req, res) => {
  try {
    const horseId = req.params.id;
    const updatedFields = req.body;

    // Check if the requested fields include changes to the horse's name
    if (updatedFields.name) {
      // If yes, update the pending changes
      await Horse.findByIdAndUpdate(horseId, { $set: { 'pendingChanges.name': updatedFields.name } });
      return res.status(200).json({ success: true, message: 'Horse name change request submitted successfully' });
    }

    // If other fields are being updated, apply the changes directly
    const updatedHorse = await Horse.findByIdAndUpdate(horseId, updatedFields, { new: true });
    res.status(200).json({ success: true, data: updatedHorse, message: 'Horse updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, message: 'Internal Server Error' });
  }
});

// Delete horse by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedHorse = await Horse.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: deletedHorse, error: null, message: 'Horse deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message, message: 'Internal Server Error' });
  }
});

export default router;

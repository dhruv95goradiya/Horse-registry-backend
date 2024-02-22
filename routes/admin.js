//admin.js - routes
import express from 'express';
import multer from 'multer';
import Admin from '../models/admin.js';
import adminAuth from '../middleware/adminAuth.js';
import Member from '../models/member.js';
import Horse from '../models/horse.js';
import OwnerChangeRequest from "../models/OwnerChangeRequestSchema.js";

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

// Admin registration route
router.post('/register', async (req, res) => {
  try {
    const newAdmin = await Admin.create(req.body);
    const token = await newAdmin.generateAuthToken();
    res.status(201).json({ success: true, data: { admin: newAdmin, token }, error: null, message: 'Admin registered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message, message: 'Internal Server Error' });
  }
});

// Example admin-only route
router.get('/admin-only', adminAuth, (req, res) => {
  res.status(200).json({ message: 'Admin-only route accessed' });
});

// Admin-only route to get all members with pagination and isActive filter
router.get('/members', adminAuth, async (req, res) => {
  try {
    // Extract query parameters for pagination (itemsPerPage and pageNo) and isActive filter
    let { itemsPerPage = 10, pageNo = 1, isActive = true } = req.query;
    itemsPerPage = parseInt(itemsPerPage);
    pageNo = parseInt(pageNo);
    isActive = isActive === 'false' ? false : true; // Convert string to boolean

    // Calculate the skip value for pagination
    const skip = (pageNo - 1) * itemsPerPage;

    // Query the database for all members with pagination and isActive filter
    const count = await Member.countDocuments({ isActive });
    const members = await Member.find({ isActive })
                                .skip(skip)
                                .limit(itemsPerPage);

    // Check if no members found
    if (members.length === 0) {
      return res.status(404).json({ 
        success: false, 
        data: null, 
        error: null, 
        message: 'No members found' 
      });
    }

    const totalPages = Math.ceil(count / itemsPerPage);

    // Send response with the paginated list of members and pagination info
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
    // Handle errors
    res.status(500).json({ 
      success: false, 
      data: null, 
      error: error.message, 
      message: 'Internal Server Error' 
    });
  }
});



// Admin-only route to get all horses within members with pagination and approval status filter
router.get('/members/:memberId/horses', adminAuth, async (req, res) => {
  try {
    const { memberId } = req.params;

    // Extract query parameters for pagination (itemsPerPage and pageNo)
    let { itemsPerPage = 10, pageNo = 1 } = req.query;
    itemsPerPage = parseInt(itemsPerPage);
    pageNo = parseInt(pageNo);

    // Calculate the skip value for pagination
    const skip = (pageNo - 1) * itemsPerPage;

    // Query the database for horses owned by the member with pagination and approval status filter
    const count = await Horse.countDocuments({ owner: memberId, approvalStatus: 'approved' });
    const horses = await Horse.find({ owner: memberId, approvalStatus: 'approved' })
                               .skip(skip)
                               .limit(itemsPerPage);

    // Check if no horses found
    if (horses.length === 0) {
      return res.status(404).json({ 
        success: false, 
        data: null, 
        error: null, 
        message: 'No approved horses found for this member' 
      });
    }

    const totalPages = Math.ceil(count / itemsPerPage);

    // Send response with the paginated list of horses and pagination info
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
      message: 'Approved horses retrieved successfully' 
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({ 
      success: false, 
      data: null, 
      error: error.message, 
      message: 'Internal Server Error' 
    });
  }
});



// Admin-only route to create a horse and associate it with a member
router.post('/horses', adminAuth, upload.fields([{ name: 'registrationDocument', maxCount: 1 }, { name: 'dnaKitDocument', maxCount: 1 }]), async (req, res) => {
  try {
    // Extract horse details from the request body
    const {
      memberID, // Assuming you provide the member ID in the request body
      registrationNum,
      name,
      sex,
      color,
      foalDate,
      bredBy,
      soldDate,
      death,
      DNA,
      DNA_CASE,
      DNA_TEST_DATE,
      verified,
      pedigree,
      markings // Include the new fields
    } = req.body;

    // Find the member to associate the horse with
    const member = await Member.findById(memberID);

    if (!member) {
      return res.status(404).json({ success: false, data: null, error: 'Member not found', message: 'Member not found' });
    }

    // Check if files were uploaded
    let registrationDocumentPath;
    let dnaKitDocumentPath;
    if (req.files['registrationDocument'] && req.files['registrationDocument'][0]) {
      registrationDocumentPath = req.files['registrationDocument'][0].path; // Store file path
    }
    if (req.files['dnaKitDocument'] && req.files['dnaKitDocument'][0]) {
      dnaKitDocumentPath = req.files['dnaKitDocument'][0].path; // Store file path
    }

    // Combine the first name and last name of the member to create ownerName
    const ownerName = `${member.firstName} ${member.lastName}`;

    // Create a new horse and associate it with the member
    const newHorse = await Horse.create({
      registrationNum,
      name,
      sex,
      color,
      foalDate,
      ownerName, // Set ownerName to the combined first name and last name
      bredBy,
      soldDate,
      death,
      DNA,
      DNA_CASE,
      DNA_TEST_DATE,
      markings,
      verified,
      pedigree,
      registrationDocument: registrationDocumentPath, // Save file path
      dnaKitDocument: dnaKitDocumentPath, // Save file path
      owner: member._id, // Assigning the member ID to the horse owner
    });

    res.status(201).json({
      success: true,
      data: newHorse,
      error: null,
      message: 'Horse created and associated with a member successfully by admin',
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message, message: 'Internal Server Error' });
  }
});

// Admin-only route to update a member by ID
router.put('/members/:id', adminAuth, async (req, res) => {
  try {
    const updatedMember = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: updatedMember, error: null, message: 'Member updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message, message: 'Internal Server Error' });
  }
});

// Admin-only route to delete a member by ID
router.delete('/members/:id', adminAuth, async (req, res) => {
  try {
    const deletedMember = await Member.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: deletedMember, error: null, message: 'Member deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message, message: 'Internal Server Error' });
  }
});

// Admin-only route to create a new member
router.post('/members', adminAuth, async (req, res) => {
  try {
    // Assuming the member details are provided in the request body
    const newMember = await Member.create(req.body);

    res.status(201).json({
      success: true,
      data: newMember,
      error: null,
      message: 'Member created successfully by admin',
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message, message: 'Internal Server Error' });
  }
});

// Route to deactivate member account
router.put('/member/:id/deactivate', adminAuth, async (req, res) => {
  try {
    const memberId = req.params.id;
    const updatedMember = await Member.findByIdAndUpdate(memberId, { isActive: false }, { new: true });
    res.status(200).json({ success: true, data: updatedMember, error: null, message: 'Member account deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message, message: 'Internal Server Error' });
  }
});

// Route to activate member account
router.put('/member/:id/activate', adminAuth, async (req, res) => {
  try {
    const memberId = req.params.id;
    const updatedMember = await Member.findByIdAndUpdate(memberId, { isActive: true }, { new: true });
    res.status(200).json({ success: true, data: updatedMember, error: null, message: 'Member account activated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message, message: 'Internal Server Error' });
  }
});

// Admin-only route to transfer ownership of a horse and update owner change request status
router.post('/transfer-horse-ownership', adminAuth, async (req, res) => {
  try {
    // Extract required data from request body
    const { horseId, newOwnerId, ownerChangeRequestId, status } = req.body;

    // Check if status is provided and valid
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, data: null, error: 'Invalid status provided', message: 'Invalid status provided' });
    }

    // If ownerChangeRequestId is provided, update owner change request status
    if (ownerChangeRequestId) {
      // Find the owner change request by ID
      const ownerChangeRequest = await OwnerChangeRequest.findById(ownerChangeRequestId);

      // Check if owner change request exists
      if (!ownerChangeRequest) {
        return res.status(404).json({ success: false, data: null, error: 'Owner change request not found', message: 'Owner change request not found' });
      }

      // Update owner change request status
      ownerChangeRequest.status = status;
      await ownerChangeRequest.save();

      // If status is 'approved', transfer ownership of the horse
      if (status === 'approved') {
        // Find the horse by ID
        const horse = await Horse.findById(horseId);

        // Check if horse exists
        if (!horse) {
          return res.status(404).json({ success: false, data: null, error: 'Horse not found', message: 'Horse not found' });
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

        return res.status(200).json({
          success: true,
          data: horse,
          error: null,
          message: 'Horse ownership transferred successfully by admin via owner change request approval',
        });
      } else {
        return res.status(200).json({
          success: true,
          data: ownerChangeRequest,
          error: null,
          message: 'Owner change request status updated successfully',
        });
      }
    }

    // If ownerChangeRequestId is not provided, proceed with transferring ownership of the horse
    // Find the horse by ID
    const horse = await Horse.findById(horseId);

    // Check if horse exists
    if (!horse) {
      return res.status(404).json({ success: false, data: null, error: 'Horse not found', message: 'Horse not found' });
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

    res.status(200).json({
      success: true,
      data: horse,
      error: null,
      message: 'Horse ownership transferred successfully by admin',
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message, message: 'Internal Server Error' });
  }
});





// Route for horse search with owner info
router.get('/horses/search', async (req, res) => {
  try {
    const { query } = req.query; // Search query provided by the client
    const regex = new RegExp(query, 'i'); // Case-insensitive regex for partial matching

    // Extract query parameters for pagination (itemsPerPage and pageNo)
    let { itemsPerPage = 10, pageNo = 1 } = req.query;
    itemsPerPage = parseInt(itemsPerPage);
    pageNo = parseInt(pageNo);

    // Calculate the skip value for pagination
    const skip = (pageNo - 1) * itemsPerPage;

    // MongoDB query to find horses matching the name or registration number with pagination
    const count = await Horse.countDocuments({
      $or: [
        { name: { $regex: regex } }, // Match horse name
        { registrationNum: { $regex: regex } } // Match registration number
      ]
    });
    const horses = await Horse.find({
      $or: [
        { name: { $regex: regex } }, // Match horse name
        { registrationNum: { $regex: regex } } // Match registration number
      ]
    })
    .populate('owner', 'firstName lastName state country')
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
      message: 'Horses retrieved successfully' 
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


// Admin statistics route
router.get('/statistics', adminAuth, async (req, res) => {
  try {
    // Calculate statistics for active members
    const activeMembersCount = await Member.countDocuments({ isActive: true });

    // Calculate statistics for inactive members
    const inactiveMembersCount = await Member.countDocuments({ isActive: false });

    // Calculate statistics for active and paid members
    const activePaidMembersCount = await Member.countDocuments({ isActive: true, isPaid: true });

    // Calculate statistics for active and not paid members
    const activeNotPaidMembersCount = await Member.countDocuments({ isActive: true, isPaid: false });

    // Calculate total number of horses
    const totalHorsesCount = await Horse.countDocuments();

    // Calculate statistics for pending horse requests
    const pendingHorseRequestsCount = await Horse.countDocuments({ approvalStatus: 'pending' });

    // Calculate statistics for pending horse name requests
    const pendingHorseNameRequestsCount = await Horse.countDocuments({ nameChangeStatus: 'pending' });

    // Calculate statistics for transfer horse requests
    const transferHorseRequestsCount = await OwnerChangeRequest.countDocuments({ status: 'pending' });

    // Prepare the response object
    const statistics = {
      activeMembers: activeMembersCount,
      inactiveMembers: inactiveMembersCount,
      activePaidMembers: activePaidMembersCount,
      activeNotPaidMembers: activeNotPaidMembersCount,
      totalHorses: totalHorsesCount,
      pendingHorseRequests: pendingHorseRequestsCount,
      pendingHorseNameRequests: pendingHorseNameRequestsCount,
      transferHorseRequests: transferHorseRequestsCount
    };

    // Send the response
    res.status(200).json({ success: true, data: statistics, error: null, message: 'Statistics retrieved successfully' });
  } catch (error) {
    // Handle errors
    res.status(500).json({ success: false, data: null, error: error.message, message: 'Internal Server Error' });
  }
});



// Admin-only route to get all horses in the system with pagination and approval status filter
router.get('/horses', adminAuth, async (req, res) => {
  try {
    // Extract query parameters for pagination (itemsPerPage and pageNo)
    let { itemsPerPage = 10, pageNo = 1 } = req.query;
    itemsPerPage = parseInt(itemsPerPage);
    pageNo = parseInt(pageNo);

    // Calculate the skip value for pagination
    const skip = (pageNo - 1) * itemsPerPage;

    // Query the database for all horses in the system with pagination and approval status filter
    const count = await Horse.countDocuments({ approvalStatus: 'approved' });
    const horses = await Horse.find({ approvalStatus: 'approved' })
                               .skip(skip)
                               .limit(itemsPerPage);

    // Check if no horses found
    if (horses.length === 0) {
      return res.status(404).json({ 
        success: false, 
        data: null, 
        error: null, 
        message: 'No approved horses found in the system' 
      });
    }

    const totalPages = Math.ceil(count / itemsPerPage);

    // Send response with the paginated list of horses and pagination info
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
      message: 'Approved horses in the system retrieved successfully' 
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({ 
      success: false, 
      data: null, 
      error: error.message, 
      message: 'Internal Server Error' 
    });
  }
});



// Admin-only route to view pending horse requests with pagination and approvalStatus filter
router.get('/pending-horses', adminAuth, async (req, res) => {
  try {
    // Extract query parameters for pagination (itemsPerPage and pageNo) and approvalStatus filter
    let { itemsPerPage = 10, pageNo = 1, approvalStatus = 'pending' } = req.query;
    itemsPerPage = parseInt(itemsPerPage);
    pageNo = parseInt(pageNo);

    // Calculate the skip value for pagination
    const skip = (pageNo - 1) * itemsPerPage;

    // Query the database for pending horse requests with pagination and approvalStatus filter
    const count = await Horse.countDocuments({ approvalStatus });
    const pendingHorses = await Horse.find({ approvalStatus })
                                     .skip(skip)
                                     .limit(itemsPerPage);

    // Send response with the paginated list of pending horse requests and pagination info
    const totalPages = Math.ceil(count / itemsPerPage);
    res.status(200).json({ 
      success: true, 
      data: pendingHorses, 
      pagination: {
        currentPage: pageNo,
        itemsPerPage: itemsPerPage,
        totalItems: count,
        totalPages: totalPages
      },
      error: null, 
      message: 'Pending horse requests retrieved successfully' 
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({ 
      success: false, 
      data: null, 
      error: error.message, 
      message: 'Internal Server Error' 
    });
  }
});



// Admin-only route to approve or reject a horse request
router.put('/approve-horse/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus, newHorseName } = req.body; // Include newHorseName in the request body

    // Find the horse by ID
    const horse = await Horse.findById(id);

    // Check if horse exists
    if (!horse) {
      return res.status(404).json({ success: false, data: null, error: 'Horse not found', message: 'Horse not found' });
    }

    // Update the approval status of the horse
    horse.approvalStatus = approvalStatus;

    // If the approval status is 'approved', handle the name change
    if (approvalStatus === 'approved' && newHorseName) {
      horse.name = newHorseName; // Update the horse's name with the new name
    }
    console.log('apps ',approvalStatus);
    console.log('horse ',horse);
    await horse.save();

    // If approved, add the horse to the member's list
    if (approvalStatus === 'approved') {
      const member = await Member.findById(horse.owner);
      // member.horses.push(horse._id);
      await member.save();
    }

    res.status(200).json({
      success: true,
      data: horse,
      error: null,
      message: `Horse request ${approvalStatus === 'approved' ? 'approved' : 'rejected'} successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message, message: 'Internal Server Error' });
  }
});

router.get('/owner-change-requests', adminAuth, async (req, res) => {
  try {
    // Extract query parameters for pagination (itemsPerPage and pageNo) and owner change request status
    let { itemsPerPage = 10, pageNo = 1, status = 'pending' } = req.query;
    itemsPerPage = parseInt(itemsPerPage);
    pageNo = parseInt(pageNo);

    // Define the filter object based on the status provided
    const filter = status ? { status: status } : {};

    // Calculate the skip value for pagination
    const skip = (pageNo - 1) * itemsPerPage;

    // Query the database for owner change requests with pagination and status filter
    const ownerChangeRequests = await OwnerChangeRequest.find(filter)
                                                       .skip(skip)
                                                       .limit(itemsPerPage);

    // Count total owner change requests
    const totalItems = await OwnerChangeRequest.countDocuments(filter);

    // Send response with the paginated list of owner change requests and pagination info
    res.status(200).json({
      success: true,
      data: ownerChangeRequests,
      pagination: {
        currentPage: pageNo,
        itemsPerPage: itemsPerPage,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / itemsPerPage)
      },
      message: 'Owner change requests retrieved successfully'
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({ success: false, error: error.message, message: 'Internal Server Error' });
  }
});

// Admin-only route to search for members
router.get('/members/search', adminAuth, async (req, res) => {
  try {
    const { query } = req.query; // Search query provided by the client
    const regex = new RegExp(query, 'i'); // Case-insensitive regex for partial matching

    // Extract query parameters for pagination (itemsPerPage and pageNo)
    let { itemsPerPage = 10, pageNo = 1 } = req.query;
    itemsPerPage = parseInt(itemsPerPage);
    pageNo = parseInt(pageNo);

    // Calculate the skip value for pagination
    const skip = (pageNo - 1) * itemsPerPage;

    // MongoDB query to find members matching the search query with pagination
    const count = await Member.countDocuments({
      $or: [
        { firstName: { $regex: regex } }, // Match first name
        { lastName: { $regex: regex } }, // Match last name
        { email: { $regex: regex } } // Match email
      ]
    });
    const members = await Member.find({
      $or: [
        { firstName: { $regex: regex } }, // Match first name
        { lastName: { $regex: regex } }, // Match last name
        { email: { $regex: regex } } // Match email
      ]
    })
    .select('-password') // Exclude password from the query results
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
      message: 'Members retrieved successfully' 
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({ 
      success: false, 
      error: error.message, 
      data: null, 
      message: 'Internal Server Error' 
    });
  }
});



export default router;

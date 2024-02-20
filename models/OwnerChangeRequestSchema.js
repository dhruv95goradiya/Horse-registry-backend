import mongoose from 'mongoose';

// Define OwnerChangeRequest schema
const OwnerChangeRequestSchema = new mongoose.Schema({
  horse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horse',
    required: true
  },
  currentOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  newOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

export default mongoose.model('OwnerChangeRequest', OwnerChangeRequestSchema);
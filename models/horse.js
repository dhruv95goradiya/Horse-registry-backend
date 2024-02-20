import mongoose from 'mongoose';

const horseSchema = new mongoose.Schema({
  registrationNum: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  sex: String,
  joint: String,
  color: String,
  foalDate: Date,
  ownerName: String,
  bredBy: String,
  buyDate: Date,
  soldDate: Date,
  death: Date,
  distance: String,
  pts: Number,
  pendingChanges: { type: Object, default: {} }, // Track pending changes, such as proposed new name
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  pedigree: { type: String, enum: ['proven', 'unproven'] },
  registrationDocument: { type: String }, // File path or URL to the registration document
  dnaKitDocument: { type: String } // File path or URL to the DNA kit document
});

export default mongoose.model('Horse', horseSchema);

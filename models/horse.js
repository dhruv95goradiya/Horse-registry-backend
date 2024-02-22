import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const horseSchema = new Schema({
  ownerName: { type: String, required: true }, 
  owner: { type: Schema.Types.ObjectId, ref: 'Member', required: true }, 
  name: { type: String, required: true }, 
  registrationNum: { type: String, required: true }, 
  sex: { type: String, required: true },
  color: { type: String, required: true },
  bredBy: { type: String, required: false },
  DNA: { type: String, enum: ['Yes', 'No'], required: true },
  DNA_CASE: { type: String }, // New field
  DNA_TEST_DATE: { type: Date }, // New field
  dnaKitDocument: { type: String }, // New field
  registrationDocument: { type: String, required: true }, // New field
  sire: { type: String },
  sireRegNum: { type: String },
  dam: { type: String },
  damRegNum: { type: String },
  grandSire: { type: String },
  grandSireRegNum: { type: String },
  grandDam: { type: String },
  grandDamRegNum: { type: String },
  greatGrandSire: { type: String },
  greatGrandSireRegNum: { type: String },
  greatGrandDam: { type: String },
  greatGrandDamRegNum: { type: String },
  foalDate: { type: Date, required: true },
  breedingDate: { type: Date }, // New field
  deathDate: { type: Date }, 
  markings: { type: String }, // New field
  pedigree: { type: String, enum: ['Proven', 'Unproven'], required: true },
  verified: { type: Boolean, required: true },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  pendingChanges: { type: Object, default: {} }, // Track pending changes, such as proposed new name
});

export default mongoose.model('Horse', horseSchema);

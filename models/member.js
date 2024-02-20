import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const memberSchema = new mongoose.Schema({
  prefix: String,
  firstName: { type: String, required: true },
  middleName: String,
  lastName: { type: String, required: true },
  suffix: String,
  address: String,
  country: String,
  state: String,
  province: String,
  city: String,
  zip: String,
  homePhone: String,
  workPhone: String,
  mobile: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: true }, // Status of member account (active/inactive)
  isPaid: { type: Boolean, default: true }, // Membership payment status, default true as the member will only register here after payment in "Wildapricot portal"
  birthday: Date,
  tokens: [{
    token: {
      type: String,
      required: true,
    },
  }],
  role: { type: String, default: 'member' },
  pendingHorses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Horse' }]
});

// Generate JWT token
memberSchema.methods.generateAuthToken = async function () {
    const token = jwt.sign({ _id: this._id.toString() }, 'test_secret');
    this.tokens = this.tokens.concat({ token });
    await this.save();
    return token;
  };
  
  // Authenticate Member
  memberSchema.statics.findByCredentials = async (email, password) => {
    const member = await Member.findOne({ email });
  
    if (!member) {
      throw new Error('Invalid login credentials');
    }
  
    const isPasswordMatch = await bcrypt.compare(password, member.password);
  
    if (!isPasswordMatch) {
      throw new Error('Invalid login credentials');
    }
  
    return member;
  };

  // Hash the password before saving
memberSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
      return next();
    }
  
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  });
  
  // Add a method to compare passwords
  memberSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
  };

export default mongoose.model('Member', memberSchema);

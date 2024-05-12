const mongoose = require("mongoose");

const managerSchema = new mongoose.Schema(
  {
    managerId: String,
    name: String,
    email: {
      type: String,
      required: [true, "Please provide an email address"],
      unique: true,
    },
    userName: {
      type: String,
      required: [true, "Please provide a username"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a strong password"],
    },
    phone: String,
    imageData: { publicId: String, imageUrl: String },
    role: { type: String, default: "AFFILIATE_MANAGER" },
    socialLink: { whatsApp: String, skype: String, telegram: String },
    status: { type: String, default: "pending" },
    isCommissionSend: { type: Boolean, default: false },
    address: {
      address: String,
      city: String,
      postalCode: String,
      country: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpiry: Date,
    forgotPassToken: String,
    forgotPassTokenExpiry: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Manager", managerSchema);

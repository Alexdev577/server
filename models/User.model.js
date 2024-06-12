const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: String,
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
    manager: {
      type: mongoose.Types.ObjectId,
      ref: "Manager",
    },
    role: { type: String, default: "USER" },
    imageData: { publicId: String, imageUrl: String },
    socialLink: String,
    status: { type: String, default: "pending" },
    address: {
      address: String,
      city: String,
      postalCode: String,
      country: String,
    },
    postbackUrl: String,
    referral: String,
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

module.exports = mongoose.model("User", userSchema);

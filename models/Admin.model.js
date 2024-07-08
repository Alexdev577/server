// const mongoose = require("mongoose");

// const adminSchema = new mongoose.Schema(
//   {
//     name: String,
//     profileImage: String,
//     email: {
//       type: String,
//       required: [true, "Please provide an email address"],
//       unique: true,
//     },
//     userName: {
//       type: String,
//       required: [true, "Please provide a username"],
//       unique: true,
//     },
//     password: {
//       type: String,
//       required: [true, "Please provide a strong password"],
//     },
//     phone: String,
//     role: { type: String, default: "ADMIN" },
//     socialLink: String,
//     status: { type: String, default: "pending" },
//     address: {
//       address: String,
//       city: String,
//       postalCode: String,
//       country: String,
//     },
//     isVerified: {
//       type: Boolean,
//       default: false,
//     },
//     verificationToken: String,
//     verificationTokenExpiry: Date,
//     forgotPassToken: String,
//     forgotPassTokenExpiry: Date,
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model("Admin", adminSchema);

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    targetRole: String,
    userInfo: { type: mongoose.Types.ObjectId, ref: "User" },
    managerInfo: { type: mongoose.Types.ObjectId, ref: "Manager" },
    heading: String,
    type: String,
    link: String,
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);

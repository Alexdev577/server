const mongoose = require("mongoose");

const userAccountSchema = new mongoose.Schema(
  {
    userOid: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    currentBalance: { type: Number, default: 0 },
    pendingWithdrawal: { type: Number, default: 0 },
    totalWithdrawal: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserAccount", userAccountSchema);

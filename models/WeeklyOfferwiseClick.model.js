const mongoose = require("mongoose");

const weeklyOfferwiseClickSchema = new mongoose.Schema(
  {
    userOid: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    offerId: String,
    offerName: String,
    lead: Number,
    transIds: [String],
    revenue: Number,
    paymentStatus: { type: String, default: "unpaid" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WeeklyOfferwiseClick", weeklyOfferwiseClickSchema);

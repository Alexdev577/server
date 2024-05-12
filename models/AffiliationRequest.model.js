const mongoose = require("mongoose");

const affiliationRequestSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Types.ObjectId,
      ref: "Campaign",
    },
    userInfo: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    approvalUrl: String,
    approvedAt: Date,
    status: { type: String, default: "pending" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AffiliationRequest", affiliationRequestSchema);

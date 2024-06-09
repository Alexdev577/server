const mongoose = require("mongoose");

const affiliationClickSchema = new mongoose.Schema(
  {
    campaignInfo: {
      type: mongoose.Types.ObjectId,
      ref: "Campaign",
    },
    offerId: String,
    offerName: String,
    userInfo: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    userId: String,
    manager: {
      type: mongoose.Types.ObjectId,
      ref: "Manager",
    },
    postbackUrl: String,
    price: Number,
    ipAddress: String,
    country: String,
    campaignUrl: String,
    transactionId: String,
    status: String,
    paymentStatus: { type: String, default: "unpaid" },
    lead: Number,
    fraudScore: Number,
    createdAt: { type: Date, default: new Date() },
    updatedAt: { type: Date, default: new Date() },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model("AffiliationClick", affiliationClickSchema);

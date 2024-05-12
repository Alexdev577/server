const mongoose = require("mongoose");

const adAffiliationClickSchema = new mongoose.Schema(
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
    userName: String,
    userId: String,
    price: Number,
    ipAddress: String,
    country: String,
    campaignUrl: String,
    transactionId: String,
    status: { type: String, default: "approved" },
    paymentStatus: { type: String, default: "unpaid" },
    lead: Number,
    createdAt: { type: Date, default: new Date() },
    updatedAt: { type: Date, default: new Date() },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model("AdAffiliationClick", adAffiliationClickSchema);

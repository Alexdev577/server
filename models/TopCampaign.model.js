const mongoose = require("mongoose");

const topCampaignSchema = new mongoose.Schema(
  {
    offerId: String,
    offerName: String,
    price: Number,
    conversionType: String,
    country: [String],
    rank: Number,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TopCampaign", topCampaignSchema);

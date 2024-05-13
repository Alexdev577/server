const mongoose = require("mongoose");

const smartLinkSchema = new mongoose.Schema(
  {
    campaignId: String,
    campaignName: { type: String, required: true },
    commission: { type: Number, default: 0 },
    priceCut: { type: Number, default: 0 },
    counter: { type: Number, default: 1 },
    status: { type: String, default: "active" },
    campaignUrl: String,
    previewLink: String,
    countries: [String],
    description: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SmartLink", smartLinkSchema);

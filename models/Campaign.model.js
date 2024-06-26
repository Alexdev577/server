const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    campaignId: String,
    campaignName: { type: String, required: true },
    category: String,
    advertiser: String,
    conversionType: String,
    trafficType: String,
    price: Number,
    commission: { type: Number, default: 0 },
    counter: { type: Number, default: 1 },
    status: { type: String, default: "active" },
    deviceType: { type: String, default: "mobile-and-desktop" },
    imageData: {
      publicId: String,
      imageUrl: {
        type: String,
        default:
          "https://res.cloudinary.com/dmw7e4fcy/image/upload/v1717304545/affburg/all%20icons/Asset_4_fhiu2u.png",
      },
    },
    campaignUrl: String,
    previewLink: String,
    countries: [String],
    description: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Campaign", campaignSchema);

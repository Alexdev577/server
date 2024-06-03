const mongoose = require("mongoose");

const topCampaignSchema = new mongoose.Schema(
  {
    offerId: String,
    imageData: {
      publicId: String,
      imageUrl: {
        type: String,
        default:
          "https://res.cloudinary.com/dmw7e4fcy/image/upload/v1717304545/affburg/all%20icons/Asset_4_fhiu2u.png",
      },
    },
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

// require
const express = require("express");
const Setting = require("../../models/Setting.model");
const TopCampaign = require("../../models/TopCampaign.model");
const AffiliationClick = require("../../models/AffiliationClick.model");
const auth = require("../../middleware/auth");

// router
const router = express.Router();

// get smart link data auth(["ADMIN", "MANAGER", "USER"]),
router.get("/", async (req, res) => {
  try {
    const setting = await Setting.findById(null);

    let bestOffers;
    if (setting?.topCampaignFlag === "original") {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10);

      const pipeline = [
        {
          $match: {
            offerId: { $ne: "0001" },
            updatedAt: {
              $gte: startDate,
              $lte: today,
            },
          },
        },
        {
          $lookup: {
            from: "campaigns",
            localField: "campaignInfo",
            foreignField: "_id",
            as: "campaign",
          },
        },
        {
          $addFields: {
            campaign: { $arrayElemAt: ["$campaign", 0] },
          },
        },
        {
          $group: {
            _id: "$offerId",
            imageData: { $first: "$campaign.imageData" },
            offerName: { $first: "$offerName" },
            price: { $first: "$price" },
            conversionType: { $first: "$campaign.conversionType" },
            country: { $first: "$campaign.countries" },
            click: { $sum: 1 },
          },
        },
        {
          $sort: {
            click: -1,
          },
        },
        {
          $limit: 15,
        },
        {
          $project: {
            _id: 0,
            imageData: 1,
            offerId: "$_id",
            offerName: 1,
            price: 1,
            conversionType: 1,
            country: 1,
          },
        },
      ];

      bestOffers = await AffiliationClick.aggregate(pipeline);
    } else {
      bestOffers = await TopCampaign.find({}).select("-_id -rank -__v -createdAt -updatedAt");
    }

    return res.status(200).json(bestOffers);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

router.put("/", auth(["ADMIN"]), async (req, res) => {
  const data = req.body;
  try {
    await TopCampaign.deleteMany({});
    await TopCampaign.insertMany(data);

    return res.status(200).json({
      message: "Top Campaigns updated!",
    });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;

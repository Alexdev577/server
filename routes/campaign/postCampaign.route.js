// require
const express = require("express");
const Campaign = require("../../models/Campaign.model");
const { cleanName, cleanUrl } = require("../../utilities/dataCleaning");
const auth = require("../../middleware/auth");

// router
const router = express.Router();

// unexpected get api response
router.get("/", (req, res, next) => {
  if (!cleanUrl(req.originalUrl)) {
    return res.status(400).json({ message: "Bad request" });
  }
  return res.status(400).json({ message: "Not applicable" });
});

// new user registration
router.post("/", auth(["ADMIN", "MANAGER"]), async (req, res) => {
  const campaignData = req.body;

  try {
    const lastDoc = await Campaign.find().sort({ _id: -1 }).limit(1);

    const campaign = new Campaign({
      ...campaignData,
      campaignId: parseInt(lastDoc[0]?.campaignId ?? 1) + 1,
      campaignName: campaignData?.campaignName && cleanName(campaignData?.campaignName),
    });

    campaign.save();

    return res.status(200).json({
      message: "Campaign creation successful!",
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

module.exports = router;

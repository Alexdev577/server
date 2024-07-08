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

// create new offer
router.post("/create", auth(["ADMIN"]), async (req, res) => {
  const campaignData = req.body;

  try {
    const lastDoc = await Campaign.find().sort({ _id: -1 }).limit(1);

    const campaign = new Campaign({
      ...campaignData,
      campaignId: parseInt(lastDoc[0]?.campaignId ?? 1) + 1,
      campaignName: campaignData?.campaignName && cleanName(campaignData?.campaignName),
    });

    await campaign.save();

    return res.status(200).json({
      message: "Campaign creation successful!",
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

//* Update offer details
router.patch("/update/:id", auth("ADMIN"), async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    // Find the manager by id field
    const exist = await Campaign.findById(id);
    // check if the user exists
    if (!exist) {
      return res.status(404).json({ message: "Campaign not found!" });
    }

    const result = await Campaign.findOneAndUpdate({ _id: id }, updateData, {
      upsert: false,
      new: true,
    });

    return res.status(200).json({
      result,
      message: "Campaign updated successfully!",
    });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

//* Delete Offer
router.delete("/delete/:id", auth(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  try {
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found!" });
    }

    const result = await Campaign.findOneAndDelete({ _id: id });

    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;

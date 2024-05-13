// require
const express = require("express");
const SmartLink = require("../../models/SmartLink.model");
const auth = require("../../middleware/auth");
const Setting = require("../../models/Setting.model");

// router
const router = express.Router();

// get smart link data
router.get("/", auth(["ADMIN", "MANAGER", "USER"]), async (req, res) => {
  try {
    const smartLinks = await SmartLink.find();

    return res.status(200).json({
      data: smartLinks,
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

// update smart link data
router.patch("/", auth(["ADMIN"]), async (req, res) => {
  const updateData = req.body;

  try {
    // Find the smart link
    const smartLink = await SmartLink.findOne({ campaignId: "0001" });

    // if not exists
    if (!smartLink) {
      const newSmartLink = new SmartLink({
        ...updateData,
        campaignId: "0001",
      });
      await newSmartLink.save();

      return res.status(200).json({
        message: "Smart link created!",
      });
    }

    await SmartLink.findOneAndUpdate({ campaignId: "0001" }, updateData, {
      upsert: true,
    });

    return res.status(200).json({
      message: "Smart link updated successfully!",
    });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;

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
    const smartLinks = await SmartLink.findOne({ campaignId: "0001" });

    return res.status(200).json(smartLinks);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

// update smart link data
router.patch("/", auth(["ADMIN"]), async (req, res) => {
  const smartLinkDetails = req.body;
  try {
    await SmartLink.findOneAndUpdate({ campaignId: "0001" }, smartLinkDetails, {
      upsert: true,
    });

    res.status(200).json({
      message: "Smart link updated successfully!",
    });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;

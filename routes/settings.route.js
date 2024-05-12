const express = require("express");
const Setting = require("../models/Setting.model.js");
const auth = require("../middleware/auth.js");
const router = express.Router();

// get settings
router.get("/", async (req, res) => {
  try {
    const setting = await Setting.findById(null);

    return res.status(200).json(setting);
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

// update settings
router.patch("/", auth(["ADMIN"]), async (req, res) => {
  const data = req.body;
  const dataToUpdate = {
    domainName: data.domainName,
    topCampaignFlag: data.topCampaignFlag,
    dayToWithdraw: data.dayToWithdraw,
    minWithdrawBalance: data.minWithdrawBalance,
  };

  try {
    const result = await Setting.findByIdAndUpdate(null, dataToUpdate, {
      upsert: true,
      new: true,
    });
    return res.status(200).json({
      data: result,
      message: "Settings updated!",
    });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;

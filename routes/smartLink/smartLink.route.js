// require
const express = require("express");
const SmartLink = require("../../models/SmartLink.model");
const auth = require("../../middleware/auth");

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
router.patch("/:id", auth(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    // Find the manager by id field
    const exist = await SmartLink.findById(id);

    // check if the user exists
    if (!exist) {
      return res.status(404).json({  message: "Link not found!" });
    }

    const { domainName } = await Setting.findById(null);
    const approvalUrl = `${domainName}?offerId=${exist?.campaignId}&affId=`;
    updateData.approvalUrl = approvalUrl;

    const result = await SmartLink.findOneAndUpdate({ _id: id }, updateData, {
      upsert: true,
    });

    return res.status(200).json({
      result,
      message: "Link updated successfully!",
    });
  } catch (error) {
    res.status(500).json({  message: error?.message });
  }
});

module.exports = router;

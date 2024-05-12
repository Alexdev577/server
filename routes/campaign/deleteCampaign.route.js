const Campaign = require("../../models/Campaign.model");
const express = require("express");
const mongoose = require("mongoose");
const auth = require("../../middleware/auth");
const router = express.Router();

//* Delete User

router.delete("/:id", auth(["ADMIN", "MANAGER"]), async (req, res) => {
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

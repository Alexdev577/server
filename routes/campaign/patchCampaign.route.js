const Campaign = require("../../models/Campaign.model");
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

//* Update User
router.patch("/single/:id", async (req, res) => {
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
      upsert: true,
    });

    return res.status(200).json({
      result,
      message: "Campaign updated successfully!",
    });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;

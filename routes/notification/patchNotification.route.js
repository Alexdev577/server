const Notification = require("../../models/Notification.model");
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

//* mark isRead single notification
router.patch("/mark-one-read/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: "Invalid notification access!" });
    }

    const result = await Notification.findOneAndUpdate(
      { _id: id },
      { isRead: true },
      {
        upsert: false,
      }
    );

    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

//* mark isRead all notification
router.patch("/mark-all-read", async (req, res) => {
  try {
    const result = await Notification.updateMany({}, { isRead: true }, { upsert: false });

    if (!result) {
      return res.status(404).json({ message: "Invalid notification access!" });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;

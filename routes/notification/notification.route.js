const Notification = require("../../models/Notification.model");
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { cleanUrl } = require("../../utilities/dataCleaning");
const auth = require("../../middleware/auth");

// get notification
router.get("/", auth(["ADMIN", "MANAGER", "USER"]), async (req, res) => {
  if (!cleanUrl(req.originalUrl)) {
    return res.status(400).json({ message: "bad request" });
  }

  try {
    let filter = {};
    if (req?.user?.role === "USER") {
      filter = { targetRole: "USER", userInfo: req?.user?._id };
    }
    if (req?.user?.role === "MANAGER") {
      filter = { targetRole: "MANAGER", managerInfo: req?.user?._id };
    }
    if (req?.user?.role === "ADMIN") {
      filter = { targetRole: "ADMIN" };
    }
    const notificationCount = await Notification.countDocuments(filter);
    const allNotification = await Notification.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      allData: allNotification,
      dataCount: notificationCount,
    });
  } catch (err) {
    res.status(500).json({ message: err?.message });
  }
});

//* mark isRead single notification
router.patch("/mark-one-read/:id", auth(["ADMIN", "MANAGER", "USER"]), async (req, res) => {
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
        new: true,
      }
    );

    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

//* mark isRead all notification
router.patch("/mark-all-read", auth(["ADMIN", "MANAGER", "USER"]), async (req, res) => {
  try {
    let filter = {};
    if (req?.user?.role === "USER") {
      filter.targetRole = "USER";
      filter.userInfo = req?.user?._id;
    }
    if (req?.user?.role === "MANAGER") {
      filter.targetRole = "MANAGER";
      filter.managerInfo = req?.user?._id;
    }
    if (req?.user?.role === "ADMIN") {
      filter.targetRole = "ADMIN";
    }

    const result = await Notification.updateMany(
      filter,
      { isRead: true },
      { upsert: false, new: true }
    );

    if (!result) {
      return res.status(404).json({ message: "Invalid notification access!" });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;

const Notification = require("../../models/Notification.model");
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { cleanUrl } = require("../../utilities/dataCleaning");
const auth = require("../../middleware/auth");

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
      filter = { targetRole: { $in: ["MANAGER", "ADMIN"] } };
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

module.exports = router;

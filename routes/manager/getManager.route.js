const Manager = require("../../models/Manager.model");
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { cleanUrl } = require("../../utilities/dataCleaning");
const auth = require("../../middleware/auth");

router.get("/list", auth(["ADMIN", "MANAGER"]), async (req, res) => {
  if (!cleanUrl(req.originalUrl)) {
    return res.status(400).json({ message: "bad request" });
  }

  try {
    let filter = { role: "MANAGER" };

    if (req?.user?.role === "MANAGER") {
      filter = { role: "MANAGER", _id: req?.user?._id };
    }

    const managerCount = await Manager.countDocuments(filter);

    const allManager = await Manager.find(filter).select("-password").sort({
      createdAt: -1,
    });

    res.status(200).json({
      allData: allManager,
      dataCount: managerCount,
    });
  } catch (err) {
    res.status(500).json({ message: err?.message });
  }
});

router.get("/single/:id", async (req, res) => {
  if (!cleanUrl(req.originalUrl)) {
    return res.status(400).json({ message: "bad request" });
  }
  try {
    const id = req.params.id;
    const allManager = await Manager.findById(id).select("-password");

    res.status(200).json({
      allData: allManager,
    });
  } catch (err) {
    res.status(500).json({ message: err?.message });
  }
});

module.exports = router;

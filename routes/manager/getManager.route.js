const Manager = require("../../models/Manager.model");
const express = require("express");
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

    const allManager = await Manager.find(filter).select("-password").sort({
      createdAt: -1,
    });

    res.status(200).json(allManager);
  } catch (err) {
    res.status(500).json({ message: err?.message });
  }
});

router.get("/single/:id", auth(["ADMIN", "MANAGER"]), async (req, res) => {
  if (!cleanUrl(req.originalUrl)) {
    return res.status(400).json({ message: "bad request" });
  }
  try {
    const id = req.params.id;
    const manager = await Manager.findById(id).select("-password");

    res.status(200).json(manager);
  } catch (err) {
    res.status(500).json({ message: err?.message });
  }
});

module.exports = router;

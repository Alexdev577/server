const express = require("express");
const auth = require("../../middleware/auth");
const router = express.Router();
const User = require("../../models/User.model");
const { ObjectId } = require("mongodb");

router.patch("/", auth(["USER"]), async (req, res) => {
  const data = req.body;
  try {
    const result = await User.findByIdAndUpdate(req?.user?._id, { postbackUrl: data?.postbackUrl });

    if (!result) {
      return res.status(404).json({ message: "not found" });
    }
    res.status(201).json({ message: "Postback Url updated" });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

router.get("/user", auth(["USER"]), async (req, res) => {
  try {
    const result = await User.findById(req?.user?._id).select("postbackUrl");

    if (!result) {
      return res.status(404).json({ message: "Postback url not found" });
    }
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;

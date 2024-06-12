const express = require("express");
const auth = require("../../middleware/auth");
const router = express.Router();
const User = require("../../models/User.model");

// create/update postback url
router.patch("/:id", auth(["USER", "ADMIN", "MANAGER"]), async (req, res) => {
  const { id } = req.params;
  const { postbackUrl } = req.body;

  try {
    if (req?.user?.role === "USER" && id !== req?.user?._id?.toString()) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    if (req?.user?.role === "MANAGER") {
      const user = await User.findById(id);

      if (!user || !user?.manager.equals(req?.user?._id)) {
        return res.status(401).json({ message: "Unauthorized access" });
      }
    }

    const result = await User.findByIdAndUpdate(id, { postbackUrl }, { new: true });

    if (!result) {
      return res.status(500).json({ message: "something went wrong" });
    }
    res.status(201).json({ message: "Postback Url updated" });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

// get postback url list
router.get("/list", auth(["ADMIN", "MANAGER"]), async (req, res) => {
  try {
    const filter = { postbackUrl: { $exists: true, $ne: "" } };

    if (req?.user?.role === "MANAGER") {
      filter.manager = req?.user?._id;
    }

    const result = await User.find(filter).select("userId userName status postbackUrl");

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

// get postback url for single user
router.get("/user", auth(["USER"]), async (req, res) => {
  try {
    const result = await User.findById(req?.user?._id).select("postbackUrl");

    if (!result) {
      return res.status(404).json({ message: "Postback url not found" });
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;

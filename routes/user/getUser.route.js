const User = require("../../models/User.model");
const express = require("express");
const router = express.Router();
const { cleanUrl } = require("../../utilities/dataCleaning");
const auth = require("../../middleware/auth");

// get filtered users
router.get("/", auth(["ADMIN", "MANAGER"]), async (req, res) => {
  if (!cleanUrl(req.originalUrl)) {
    return res.status(400).json({ message: "bad request" });
  }
  const { startDate, endDate, searchTerm, status } = req.query;
  const filterableFields = ["userId", "userName", "email", "name", "phone"];

  try {
    const conditions = [];
    // Add managerId condition to access control
    if (req.user?.role === "MANAGER") {
      conditions.push({ $or: [{ manager: req?.user?._id }, { manager: { $exists: false } }] });
    }

    // Add searchTerm condition if present
    if (searchTerm) {
      conditions.push({
        $or: filterableFields.map((field) => ({
          [field]: {
            $regex: searchTerm,
            $options: "i",
          },
        })),
      });
    } else {
      if (startDate && endDate && startDate !== endDate) {
        // modify startDate and endDate
        const modStartDate = new Date(startDate);
        modStartDate.setHours(0);
        modStartDate.setMinutes(0);
        modStartDate.setSeconds(0);
        const modEndDate = new Date(endDate);
        modEndDate.setHours(0);
        modEndDate.setMinutes(0);
        modEndDate.setSeconds(0);

        conditions.push({
          createdAt: {
            $gte: modStartDate,
            $lte: modEndDate,
          },
        });
      }
      if (status) {
        conditions.push({
          status: status,
        });
      }
    }

    // final query
    const query = conditions.length > 0 ? { $and: conditions } : {};

    const result = await User.find(query).select("-password");

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err?.message });
  }
});

// get filtered users/manager-affiliates
router.get("/manager-affiliates", auth(["MANAGER"]), async (req, res) => {
  if (!cleanUrl(req.originalUrl)) {
    return res.status(400).json({ message: "bad request" });
  }
  const { startDate, endDate, searchTerm, status } = req.query;
  const filterableFields = ["userId", "userName", "email", "name", "phone"];

  try {
    const conditions = [{ manager: req?.user?._id }];

    // Add searchTerm condition if present
    if (searchTerm) {
      conditions.push({
        $or: filterableFields.map((field) => ({
          [field]: {
            $regex: searchTerm,
            $options: "i",
          },
        })),
      });
    } else {
      if (startDate && endDate && startDate !== endDate) {
        // modify startDate and endDate
        const modStartDate = new Date(startDate);
        modStartDate.setHours(0);
        modStartDate.setMinutes(0);
        modStartDate.setSeconds(0);
        const modEndDate = new Date(endDate);
        modEndDate.setHours(0);
        modEndDate.setMinutes(0);
        modEndDate.setSeconds(0);

        conditions.push({
          createdAt: {
            $gte: modStartDate,
            $lte: modEndDate,
          },
        });
      }
      if (status) {
        conditions.push({
          status: status,
        });
      }
    }

    // final query
    const query = conditions.length > 0 ? { $and: conditions } : {};

    const result = await User.find(query).select("-password");

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err?.message });
  }
});

//* get single users data
router.get("/single/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

//get pending user
router.get("/affiliate-manager", auth(["USER"]), async (req, res) => {
  try {
    const result = await User.findById(req.user._id)
      .select("manager")
      .populate([
        {
          path: "manager",
          select: "name userName email phone imageData socialLink address managerId",
        },
      ]);

    return res.status(200).json(result?.manager);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

//get pending user
router.get("/pending-request", async (req, res) => {
  try {
    const count = await User.countDocuments({ status: "pending" });

    return res.status(200).json({
      dataCount: count,
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

module.exports = router;

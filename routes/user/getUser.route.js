const User = require("../../models/User.model");
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { cleanUrl } = require("../../utilities/dataCleaning");
const { userFilterableFields } = require("./user.constant");
const pick = require("../../shared/pick");
const { calculatePagination } = require("../../helper/paginationHelper");
const auth = require("../../middleware/auth");

// get users with pagination and sorting
router.get("/", async (req, res) => {
  if (!cleanUrl(req.originalUrl)) {
    return res.status(400).json({ message: "bad request" });
  }

  try {
    // Extract query parameters for pagination and sorting
    const { page = 1, sort = "date", status = "All" } = req.query;

    const filter = {};

    status !== "All" && (filter.status = status);

    // Build the sort object based on the requested sorting method
    // const sortOptions = {};
    // if (sort === "serial") {
    //   sortOptions.serial = 1;
    // } else if (sort === "date") {
    //   sortOptions.createdAt = -1;
    // }

    // Find the total number of documents in the collection
    const userCount = await User.countDocuments();

    // Query the database with pagination and sorting
    const allUsers = await User.find(filter).select("-password").sort({ createdAt: -1 });

    res.status(200).json({
      allData: allUsers,
      dataCount: userCount,
    });
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

// get filtered users with pagination and sorting
router.get("/query-user", auth(["ADMIN", "MANAGER"]), async (req, res) => {
  if (!cleanUrl(req.originalUrl)) {
    return res.status(400).json({ message: "bad request" });
  }

  try {
    const filters = pick(req.query, userFilterableFields);
    const paginationOptions = pick(req.query, [
      "page",
      "limit",
      "sortBy",
      "sortOrder",
      "startDate",
      "endDate",
    ]);

    const { searchTerm, ...filtersData } = filters;
    const andConditions = [];

    if (req.user.role === "MANAGER") {
      andConditions.push({
        managerId: req?.user?._id,
      });
    }

    if (searchTerm) {
      andConditions.push({
        $or: userFilterableFields.map((field) => ({
          [field]: {
            $regex: searchTerm,
            $options: "i",
          },
        })),
      });
    }

    if (Object.keys(filtersData).length) {
      andConditions.push({
        $and: Object.entries(filtersData).map(([field, value]) => ({
          [field]: value,
        })),
      });
    }
    const { limit, skip, sortBy, sortOrder, endDate, startDate } =
      calculatePagination(paginationOptions);

    if (startDate !== endDate) {
      andConditions.push({
        $and: [
          {
            createdAt: {
              $gte: new Date(startDate).toISOString(),
              $lte: new Date(endDate).toISOString(),
            },
          },
        ],
      });
    }

    const sortCondition = {};

    if (sortBy && sortOrder) {
      sortCondition[sortBy] = sortOrder;
    }

    const whereCondition = andConditions.length > 0 ? { $and: andConditions } : {};

    const result = await User.find(whereCondition).select("-password").sort(sortCondition);

    const total = await User.countDocuments(whereCondition);

    res.status(200).json({
      allData: result,
      dataCount: total,
    });
  } catch (err) {
    res.status(500).json({ message: err?.message });
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
    const requestCount = await User.countDocuments({ status: "pending" });

    return res.status(200).json({
      dataCount: requestCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

module.exports = router;

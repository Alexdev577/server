// require
const express = require("express");
const AffiliationClick = require("../../models/AffiliationClick.model");
const auth = require("../../middleware/auth");

// router
const router = express.Router();

// top affiliates
router.get("/", auth(["ADMIN"]), async (req, res) => {
  try {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10);

    const pipeline = [
      {
        $match: {
          updatedAt: {
            $gte: startDate,
            $lte: today,
          },
        },
      },
      {
        $group: {
          _id: "$userId",
          click: { $sum: 1 },
          lead: { $sum: "$lead" },
          revenue: { $sum: { $multiply: ["$price", "$lead"] } },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "userId",
          as: "user",
        },
      },
      {
        $addFields: {
          user: { $arrayElemAt: ["$user", 0] },
        },
      },
      {
        $sort: {
          click: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 1,
          click: 1,
          lead: 1,
          revenue: 1,
          userId: "$user.userId",
          userName: "$user.userName",
          email: "$user.email",
          phone: "$user.phone",
          status: "$user.status",
        },
      },
    ];

    const topAffiliates = await AffiliationClick.aggregate(pipeline);

    return res.status(200).json(topAffiliates);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

module.exports = router;

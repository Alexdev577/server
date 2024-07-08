const express = require("express");
const router = express.Router();
const AffiliationClick = require("../../models/AffiliationClick.model");
const AdAffiliationClick = require("../../models/AdAffiliationClick.model");
const ReportArchive = require("../../models/ReportArchive.model");
const auth = require("../../middleware/auth");

// post report archive
router.post("/report/:pastMonth", auth(["ADMIN"]), async (req, res) => {
  const { pastMonth } = req.params;

  if (parseInt(pastMonth) < 2) {
    return res.status(406).json({ message: "Invalid date range" });
  }

  try {
    const today = new Date();
    const dateBefore = new Date(today.getFullYear(), today.getMonth() - parseInt(pastMonth), 1);
    console.log(dateBefore);
    const archivedData = await calculateData(dateBefore);

    const postArchive = await ReportArchive.insertMany(archivedData);

    if (postArchive) {
      await AffiliationClick.deleteMany({
        updatedAt: {
          $lt: dateBefore,
        },
      });
      await AdAffiliationClick.deleteMany({
        updatedAt: {
          $lt: dateBefore,
        },
      });
    }

    return res.status(200).json({ message: `${postArchive?.length} Archived` });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error?.message });
  }
});

// get report archive
router.get("/report", auth(["ADMIN", "MANAGER", "USER"]), async (req, res) => {
  try {
    const filter = {};
    if (req?.user?.role === "USER") {
      filter.userId = req?.user?.userId;
    }
    if (req?.user?.role === "MANAGER") {
      filter.manager = req?.user?._id;
    }

    const archivedData = await ReportArchive.find(filter);

    return res.status(200).json(archivedData);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

const calculateData = async (date) => {
  const pipeline = [
    {
      $match: {
        updatedAt: {
          $lt: date,
        },
      },
    },
    {
      $group: {
        _id: {
          userId: "$userId",
          month: { $dateToString: { format: "%b %Y", date: "$updatedAt" } },
        },
        manager: { $first: "$manager" },
        click: { $sum: 1 },
        uniqueClick: { $addToSet: "$ipAddress" },
        lead: { $sum: "$lead" },
        revenue: { $sum: { $multiply: ["$price", "$lead"] } },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id.userId",
        foreignField: "userId",
        as: "userInfo",
      },
    },
    {
      $addFields: {
        userInfo: { $arrayElemAt: ["$userInfo", 0] },
      },
    },
    {
      $project: {
        _id: 0,
        userId: "$_id.userId",
        userName: "$userInfo.userName",
        manager: 1,
        month: "$_id.month",
        click: "$click",
        uniqueClick: { $size: "$uniqueClick" },
        lead: "$lead",
        revenue: "$revenue",
        epc: { $divide: ["$revenue", "$click"] },
      },
    },
  ];
  return await AffiliationClick.aggregate(pipeline);
};

module.exports = router;

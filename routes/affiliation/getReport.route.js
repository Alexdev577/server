const express = require("express");
const AffiliationClick = require("../../models/AffiliationClick.model");
const auth = require("../../middleware/auth");
const { ObjectId } = require("mongodb");
const moment = require("moment");

const router = express.Router();

//================= User Report ==================//
// get user affiliation report
router.get("/user", auth(["USER"]), async (req, res) => {
  const { startDate, endDate, transStatus } = req.query;

  try {
    const today = new Date();
    const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // ------------------- monthly pipeline ------------------- //
    const monthlyPipeline = [
      {
        $match: {
          userInfo: req?.user?._id,
          status: { $ne: "denied" },
          updatedAt: {
            $gte: startOfThisMonth,
            $lte: today,
          },
        },
      },
      {
        $group: {
          _id: "$status",
          click: { $sum: 1 },
          uniqueClick: { $addToSet: "$ipAddress" },
          lead: { $sum: "$lead" },
          revenue: { $sum: { $multiply: ["$price", "$lead"] } },
        },
      },
      {
        $group: {
          _id: null,
          click: { $sum: "$click" },
          uniqueClick: { $addToSet: "$uniqueClick" },
          lead: { $sum: "$lead" },
          revenue: { $sum: "$revenue" },
          pendingRevenue: {
            $sum: {
              $cond: [{ $eq: ["$_id", "pending"] }, "$revenue", 0],
            },
          },
          approvedRevenue: {
            $sum: {
              $cond: [{ $eq: ["$_id", "approved"] }, "$revenue", 0],
            },
          },
        },
      },
      {
        $unwind: "$uniqueClick",
      },
      {
        $unwind: "$uniqueClick",
      },
      {
        $group: {
          _id: null,
          click: { $first: "$click" },
          uniqueClick: { $addToSet: "$uniqueClick" },
          lead: { $first: "$lead" },
          revenue: { $first: "$revenue" },
          pendingRevenue: { $first: "$pendingRevenue" },
          approvedRevenue: { $first: "$approvedRevenue" },
        },
      },
      {
        $project: {
          _id: 0,
          click: 1,
          uniqueClick: { $size: "$uniqueClick" },
          lead: 1,
          revenue: 1,
          pendingRevenue: 1,
          approvedRevenue: 1,
          epc: { $divide: ["$revenue", "$click"] },
        },
      },
    ];

    // --------------- conditional daily pipeline --------------- //
    // modify start and end dates
    const startOfStartDate = moment(startDate, "ddd MMM DD YYYY HH:mm:ss")
      .startOf("day")
      .format("YYYY-MM-DD");
    const endOfEndDate = moment(endDate, "ddd MMM DD YYYY HH:mm:ss")
      .endOf("day")
      .format("YYYY-MM-DDTHH:mm:ss");

    let matchStage = {
      userInfo: req?.user?._id,
      updatedAt: {
        $gte: new Date(startOfStartDate),
        $lte: new Date(endOfEndDate + "Z"),
      },
    };

    if (transStatus && transStatus !== "approved") {
      matchStage = {
        userInfo: req?.user?._id,
        status: transStatus,
        updatedAt: {
          $gte: new Date(startOfStartDate),
          $lte: new Date(endOfEndDate + "Z"),
        },
      };
    }
    if (transStatus && transStatus == "approved") {
      matchStage = {
        userInfo: req?.user?._id,
        status: { $nin: ["pending", "denied"] },
        updatedAt: {
          $gte: new Date(startOfStartDate),
          $lte: new Date(endOfEndDate + "Z"),
        },
      };
    }

    let dailyPipeline = [];

    if (startDate && endDate && startDate !== endDate) {
      dailyPipeline = [
        {
          $match: matchStage,
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%d %b %Y", date: "$updatedAt" },
            },
            click: { $sum: 1 },
            uniqueClick: { $addToSet: "$ipAddress" },
            lead: { $sum: "$lead" },
            revenue: { $sum: { $multiply: ["$price", "$lead"] } },
          },
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            click: 1,
            uniqueClick: { $size: "$uniqueClick" },
            lead: 1,
            status: 1,
            revenue: 1,
            epc: { $divide: ["$revenue", "$click"] },
          },
        },
        {
          $group: {
            _id: null,
            totalClick: { $sum: "$click" },
            totalUniqueClick: { $sum: "$uniqueClick" },
            totalLead: { $sum: "$lead" },
            totalRevenue: { $sum: "$revenue" },
            totalEPC: { $sum: "$epc" },
            offerData: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            _id: 0,
            totalClick: 1,
            totalUniqueClick: 1,
            totalLead: 1,
            totalRevenue: 1,
            totalEPC: 1,
            offerData: 1,
          },
        },
      ];
    } else {
      dailyPipeline = [
        {
          $match: matchStage,
        },
        {
          $group: {
            _id: "$offerId",
            offerName: { $first: "$offerName" },
            click: { $sum: 1 },
            uniqueClick: { $addToSet: "$ipAddress" },
            lead: { $sum: "$lead" },
            revenue: { $sum: { $multiply: ["$price", "$lead"] } },
          },
        },
        {
          $project: {
            _id: 0,
            offerId: "$_id",
            offerName: "$offerName",
            click: 1,
            uniqueClick: { $size: "$uniqueClick" },
            lead: 1,
            revenue: 1,
            epc: { $divide: ["$revenue", "$click"] },
          },
        },
        {
          $group: {
            _id: null,
            totalClick: { $sum: "$click" },
            totalUniqueClick: { $sum: "$uniqueClick" },
            totalLead: { $sum: "$lead" },
            totalRevenue: { $sum: "$revenue" },
            totalEPC: { $sum: "$epc" },
            offerData: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            _id: 0,
            totalClick: 1,
            totalUniqueClick: 1,
            totalLead: 1,
            totalRevenue: 1,
            totalEPC: 1,
            offerData: 1,
          },
        },
      ];
    }

    //------------- get monthly click data -----------------//
    const monthlyData = await AffiliationClick.aggregate(monthlyPipeline);
    // const monthlyData = await AffiliationClick.aggregate(monthlyPipeline);
    //-------------- get daily click data -----------------//
    const dailyData = await AffiliationClick.aggregate(dailyPipeline);

    return res.status(200).json({ monthlyData: monthlyData?.[0], dailyData: dailyData?.[0] });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

// get user affiliation report by offerId
router.get("/user/offerId/:offerId", auth(["USER"]), async (req, res) => {
  const { offerId } = req.params;
  const { startDate, endDate, status } = req.query;

  try {
    // modify start and end dates
    const startOfStartDate = moment(startDate, "ddd MMM DD YYYY HH:mm:ss")
      .startOf("day")
      .format("YYYY-MM-DD");
    const endOfEndDate = moment(endDate, "ddd MMM DD YYYY HH:mm:ss")
      .endOf("day")
      .format("YYYY-MM-DDTHH:mm:ss");

    let matchStage = {
      userInfo: req?.user?._id,
      offerId,
      status: { $nin: ["pending", "denied"] },
      updatedAt: {
        $gte: new Date(startOfStartDate),
        $lte: new Date(endOfEndDate + "Z"),
      },
    };
    if (status === "pending" || status === "denied") {
      matchStage = {
        userInfo: req?.user?._id,
        offerId,
        status,
        updatedAt: {
          $gte: new Date(startOfStartDate),
          $lte: new Date(endOfEndDate + "Z"),
        },
      };
    }

    const pipeline = [
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: "$country",
          offerId: { $first: "$offerId" },
          offerName: { $first: "$offerName" },
          click: { $sum: 1 },
          uniqueClick: { $addToSet: "$ipAddress" },
          lead: { $sum: "$lead" },
          revenue: { $sum: { $multiply: ["$price", "$lead"] } },
        },
      },
      {
        $group: {
          _id: 0,
          offerId: { $first: "$offerId" },
          offerName: { $first: "$offerName" },
          details: {
            $push: {
              country: "$_id",
              click: "$click",
              uniqueClick: { $size: "$uniqueClick" },
              lead: "$lead",
              revenue: "$revenue",
              epc: { $divide: ["$revenue", "$click"] },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          offerId: 1,
          offerName: 1,
          click: { $sum: "$details.click" },
          uniqueClick: { $sum: "$details.uniqueClick" },
          lead: { $sum: "$details.lead" },
          revenue: { $sum: "$details.revenue" },
          epc: { $sum: "$details.epc" },
          details: 1,
        },
      },
    ];

    //-------------- get offerwise data -----------------//
    const offerReoprt = await AffiliationClick.aggregate(pipeline);

    return res.status(200).json(offerReoprt?.[0]);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

// user conversion report
router.get("/user/conversion", auth(["USER"]), async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    // modify start and end dates
    const startOfStartDate = moment(startDate, "ddd MMM DD YYYY HH:mm:ss")
      .startOf("day")
      .format("YYYY-MM-DD");
    const endOfEndDate = moment(endDate, "ddd MMM DD YYYY HH:mm:ss")
      .endOf("day")
      .format("YYYY-MM-DDTHH:mm:ss");

    const filter = {
      userInfo: req?.user?._id,
      lead: 1,
      updatedAt: {
        $gte: new Date(startOfStartDate),
        $lte: new Date(endOfEndDate + "Z"),
      },
    };

    const conversionData = await AffiliationClick.find(filter).select(
      "offerId offerName price fraudScore country transactionId updatedAt status"
    );

    //-------------- get daily click data -----------------//
    return res.status(200).json(conversionData);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

// get user dashboard data
router.get("/user/revenue", auth(["USER"]), async (req, res) => {
  try {
    const today = new Date();
    const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // ------------------- life time pending revenue ------------------- //
    const pendingPipeline = [
      {
        $match: {
          userInfo: req?.user?._id,
          lead: 1,
          status: "pending",
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: { $multiply: ["$price", "$lead"] } },
        },
      },
      {
        $project: {
          _id: 0,
          revenue: 1,
        },
      },
    ];
    const pendingData = await AffiliationClick.aggregate(pendingPipeline);

    // // ------------------- monthly revenue ------------------- //
    const monthlyPipeline = [
      {
        $match: {
          userInfo: req?.user?._id,
          lead: 1,
          status: "approved",
          updatedAt: {
            $gte: startOfThisMonth,
            $lte: today,
          },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: { $multiply: ["$price", "$lead"] } },
        },
      },
      {
        $project: {
          _id: 0,
          revenue: 1,
        },
      },
    ];
    const monthlyData = await AffiliationClick.aggregate(monthlyPipeline);

    // ------------------- yesterday revenue ------------------- //
    const yesterdayPipeline = [
      {
        $match: {
          userInfo: req?.user?._id,
          lead: 1,
          status: "approved",
          updatedAt: {
            $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
            $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: { $multiply: ["$price", "$lead"] } },
        },
      },
      {
        $project: {
          _id: 0,
          revenue: 1,
        },
      },
    ];
    const yesterdayData = await AffiliationClick.aggregate(yesterdayPipeline);

    // ------------------- today's pipeline ------------------- //
    const todayPipeline = [
      {
        $match: {
          userInfo: req?.user?._id,
          updatedAt: {
            $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          },
        },
      },
      {
        $group: {
          _id: null,
          click: { $sum: 1 },
          uniqueClick: { $addToSet: "$ipAddress" },
          lead: { $sum: "$lead" },
          revenue: { $sum: { $multiply: ["$price", "$lead"] } },
        },
      },
      {
        $project: {
          _id: 0,
          click: 1,
          uniqueClick: { $size: "$uniqueClick" },
          lead: 1,
          revenue: 1,
        },
      },
    ];
    const todayData = await AffiliationClick.aggregate(todayPipeline);

    // --------------- click/lead grapgh of last ten days --------------- //
    const graphPipeline = [
      {
        $match: {
          userInfo: req?.user?._id,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%b %d", date: "$updatedAt" },
          },
          date: { $first: "$updatedAt" },
          click: { $sum: 1 },
          lead: { $sum: "$lead" },
        },
      },
      {
        $sort: {
          date: -1,
        },
      },
      {
        $limit: 15,
      },
      {
        $sort: {
          date: 1,
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          click: 1,
          lead: 1,
        },
      },
    ];
    const graphData = await AffiliationClick.aggregate(graphPipeline);

    return res.status(200).json({
      allTimePendingRev: pendingData?.[0]?.revenue,
      monthlyRevenue: monthlyData?.[0]?.revenue,
      yesterdayRevenue: yesterdayData?.[0]?.revenue,
      todayRevenue: todayData?.[0]?.revenue,
      todayClick: todayData?.[0]?.click,
      todayUniqueClick: todayData?.[0]?.uniqueClick,
      todayLead: todayData?.[0]?.lead,
      graphData: graphData,
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

//================= Manager Report ==================//

// daily affiliation report - all
router.get("/quick-report", auth(["ADMIN", "MANAGER"]), async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    // modify start and end dates
    const startOfStartDate = moment(startDate, "ddd MMM DD YYYY HH:mm:ss")
      .startOf("day")
      .format("YYYY-MM-DD");
    const endOfEndDate = moment(endDate, "ddd MMM DD YYYY HH:mm:ss")
      .endOf("day")
      .format("YYYY-MM-DDTHH:mm:ss");

    let pipeline;

    const matchStage = {
      updatedAt: {
        $gte: new Date(startOfStartDate),
        $lte: new Date(endOfEndDate + "Z"),
      },
    };
    if (req?.user?.role === "MANAGER") {
      matchStage.manager = req?.user?._id;
    }

    if (startDate && endDate && startDate !== endDate) {
      pipeline = [
        {
          $match: matchStage,
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%d %b %Y", date: "$updatedAt" },
            },
            click: { $sum: 1 },
            uniqueClick: { $addToSet: "$ipAddress" },
            transIds: {
              $addToSet: {
                $cond: {
                  if: { $eq: ["$lead", 1] },
                  then: "$transactionId",
                  else: "$$REMOVE",
                },
              },
            },
            lead: { $sum: "$lead" },
            revenue: { $sum: { $multiply: ["$price", "$lead"] } },
          },
        },
        {
          $group: {
            _id: 0,
            details: {
              $push: {
                date: "$_id",
                click: "$click",
                uniqueClick: { $size: "$uniqueClick" },
                transIds: "$transIds",
                lead: "$lead",
                revenue: "$revenue",
                epc: { $divide: ["$revenue", "$click"] },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            click: { $sum: "$details.click" },
            uniqueClick: { $sum: "$details.uniqueClick" },
            lead: { $sum: "$details.lead" },
            revenue: { $sum: "$details.revenue" },
            epc: { $sum: "$details.epc" },
            details: 1,
          },
        },
      ];
    } else {
      pipeline = [
        {
          $match: matchStage,
        },
        {
          $group: {
            _id: "$offerId",
            offerName: { $first: "$offerName" },
            click: { $sum: 1 },
            uniqueClick: { $addToSet: "$ipAddress" },
            transIds: {
              $addToSet: {
                $cond: {
                  if: { $eq: ["$lead", 1] },
                  then: "$transactionId",
                  else: "$$REMOVE",
                },
              },
            },
            lead: { $sum: "$lead" },
            revenue: { $sum: { $multiply: ["$price", "$lead"] } },
          },
        },
        {
          $group: {
            _id: 0,
            details: {
              $push: {
                offerId: "$_id",
                offerName: "$offerName",
                click: "$click",
                uniqueClick: { $size: "$uniqueClick" },
                transIds: "$transIds",
                lead: "$lead",
                revenue: "$revenue",
                epc: { $divide: ["$revenue", "$click"] },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            click: { $sum: "$details.click" },
            uniqueClick: { $sum: "$details.uniqueClick" },
            lead: { $sum: "$details.lead" },
            revenue: { $sum: "$details.revenue" },
            epc: { $sum: "$details.epc" },
            details: 1,
          },
        },
      ];
    }

    const quickReoprt = await AffiliationClick.aggregate(pipeline);

    return res.status(200).json(quickReoprt?.[0]);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

// daily affiliation report per offerId
router.get("/quick-report/:offerId", auth(["ADMIN", "MANAGER"]), async (req, res) => {
  const { offerId } = req.params;
  const { startDate, endDate } = req.query;

  try {
    // modify start and end dates
    const startOfStartDate = moment(startDate, "ddd MMM DD YYYY HH:mm:ss")
      .startOf("day")
      .format("YYYY-MM-DD");
    const endOfEndDate = moment(endDate, "ddd MMM DD YYYY HH:mm:ss")
      .endOf("day")
      .format("YYYY-MM-DDTHH:mm:ss");

    const matchStage = {
      offerId: offerId,
      updatedAt: {
        $gte: new Date(startOfStartDate),
        $lte: new Date(endOfEndDate + "Z"),
      },
    };
    if (req?.user?.role === "MANAGER") {
      matchStage.manager = req?.user?._id;
    }

    const pipeline = [
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: "$userInfo",
          offerId: { $first: "$offerId" },
          offerName: { $first: "$offerName" },
          click: { $sum: 1 },
          uniqueClick: { $addToSet: "$ipAddress" },
          transIds: {
            $addToSet: {
              $cond: {
                if: { $eq: ["$lead", 1] },
                then: "$transactionId",
                else: "$$REMOVE",
              },
            },
          },
          lead: { $sum: "$lead" },
          revenue: { $sum: { $multiply: ["$price", "$lead"] } },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
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
          offerId: "$offerId",
          offerName: "$offerName",
          userName: "$userInfo.name",
          user_Oid: "$userInfo._id",
          userId: "$userInfo.userId",
          click: "$click",
          uniqueClick: { $size: "$uniqueClick" },
          transIds: "$transIds",
          lead: "$lead",
          revenue: "$revenue",
          epc: { $divide: ["$revenue", "$click"] },
        },
      },
      {
        $group: {
          _id: 0,
          offerId: { $first: "$offerId" },
          offerName: { $first: "$offerName" },
          details: {
            $push: {
              userName: "$userName",
              user_Oid: "$user_Oid",
              userId: "$userId",
              click: "$click",
              uniqueClick: "$uniqueClick",
              transIds: "$transIds",
              lead: "$lead",
              revenue: "$revenue",
              epc: { $divide: ["$revenue", "$click"] },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          offerId: 1,
          offerName: 1,
          click: { $sum: "$details.click" },
          uniqueClick: { $sum: "$details.uniqueClick" },
          lead: { $sum: "$details.lead" },
          revenue: { $sum: "$details.revenue" },
          epc: { $sum: "$details.epc" },
          details: 1,
        },
      },
    ];

    const quickReport = await AffiliationClick.aggregate(pipeline);

    return res.status(200).json(quickReport?.[0]);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

// daily affiliation report per userId
router.get("/quick-report/userId/:userId", auth(["ADMIN", "MANAGER"]), async (req, res) => {
  const { userId } = req.params;
  const { offerId, startDate, endDate } = req.query;

  try {
    // modify start and end dates
    const startOfStartDate = moment(startDate, "ddd MMM DD YYYY HH:mm:ss")
      .startOf("day")
      .format("YYYY-MM-DD");
    const endOfEndDate = moment(endDate, "ddd MMM DD YYYY HH:mm:ss")
      .endOf("day")
      .format("YYYY-MM-DDTHH:mm:ss");

    const matchStage = {
      userInfo: new ObjectId(userId),
      offerId,
      updatedAt: {
        $gte: new Date(startOfStartDate),
        $lte: new Date(endOfEndDate + "Z"),
      },
    };
    if (req?.user?.role === "MANAGER") {
      matchStage.manager = req?.user?._id;
    }

    const pipeline = [
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: "$country",
          offerId: { $first: "$offerId" },
          offerName: { $first: "$offerName" },
          userId: { $first: "$userInfo" },
          click: { $sum: 1 },
          uniqueClick: { $addToSet: "$ipAddress" },
          transIds: {
            $addToSet: {
              $cond: {
                if: { $eq: ["$lead", 1] },
                then: "$transactionId",
                else: "$$REMOVE",
              },
            },
          },
          lead: { $sum: "$lead" },
          revenue: { $sum: { $multiply: ["$price", "$lead"] } },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
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
          offerId: 1,
          offerName: 1,
          userName: "$userInfo.name",
          userId: "$userInfo.userId",
          country: "$_id",
          click: 1,
          uniqueClick: { $size: "$uniqueClick" },
          transIds: "$transIds",
          lead: 1,
          revenue: 1,
          epc: { $divide: ["$revenue", "$click"] },
        },
      },
      {
        $group: {
          _id: 0,
          offerId: { $first: "$offerId" },
          offerName: { $first: "$offerName" },
          userName: { $first: "$userName" },
          userId: { $first: "$userId" },
          click: { $sum: "$click" },
          uniqueClick: { $sum: "$uniqueClick" },
          lead: { $sum: "$lead" },
          revenue: { $sum: "$revenue" },
          epc: { $sum: "$epc" },
          details: {
            $push: {
              country: "$country",
              click: "$click",
              uniqueClick: "$uniqueClick",
              transIds: "$transIds",
              lead: "$lead",
              revenue: "$revenue",
              epc: "$epc",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          offerId: 1,
          offerName: 1,
          userName: 1,
          userId: 1,
          click: 1,
          uniqueClick: 1,
          lead: 1,
          revenue: 1,
          epc: 1,
          details: 1,
        },
      },
    ];

    const quickReoprt = await AffiliationClick.aggregate(pipeline);

    return res.status(200).json(quickReoprt?.[0]);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

// daily affiliation report per userId
router.get("/conversion-report", auth(["ADMIN", "MANAGER"]), async (req, res) => {
  const { transIds, userId, startDate, endDate } = req.query;

  try {
    // modify start and end dates
    const startOfStartDate = moment(startDate, "ddd MMM DD YYYY HH:mm:ss")
      .startOf("day")
      .format("YYYY-MM-DD");
    const endOfEndDate = moment(endDate, "ddd MMM DD YYYY HH:mm:ss")
      .endOf("day")
      .format("YYYY-MM-DDTHH:mm:ss");

    let filter = {
      lead: 1,
      updatedAt: {
        $gte: new Date(startOfStartDate),
        $lte: new Date(endOfEndDate + "Z"),
      },
    };

    if (userId) {
      filter.$or = [
        {
          userId: {
            $regex: userId,
            $options: "i",
          },
        },
        {
          offerId: {
            $regex: userId,
            $options: "i",
          },
        },
      ];
    } else if (transIds) {
      const searchIds = transIds.split("-");
      filter = {
        transactionId: { $in: searchIds },
      };
    }

    if (req?.user?.role === "MANAGER") {
      filter.manager = req?.user?._id;
    }

    const report = await AffiliationClick.find(filter).select(
      "offerId userId transactionId price country updatedAt status fraudScore"
    );

    return res.status(200).json(report);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

module.exports = router;

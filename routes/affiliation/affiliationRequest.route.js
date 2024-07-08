// require
const express = require("express");
const AffiliationRequest = require("../../models/AffiliationRequest.model");
const Campaign = require("../../models/Campaign.model");
const Notification = require("../../models/Notification.model");
const auth = require("../../middleware/auth");
const { mySimpleEncoder } = require("../../utilities/encoderDecoder.js");

// router
const router = express.Router();

// post campaign request
router.post("/", auth(["USER"]), async (req, res) => {
  const requestData = req.body;

  try {
    if (req?.user?.status !== "active") {
      return res.status(401).json({ message: "unauthorized access!" });
    }

    const offerData = await Campaign.findById(requestData?.campaign);
    if (!offerData || offerData?.status !== "active") {
      return res.status(404).json({ message: "no active offer found!" });
    }

    const exists = await AffiliationRequest.findOne({
      campaign: requestData?.campaign,
      userInfo: req?.user?._id,
    });
    if (exists) {
      return res.status(400).json({
        message: "You've already requested for this offer!",
      });
    }

    const campaignReq = new AffiliationRequest({
      campaign: offerData?._id,
      userInfo: req?.user?._id,
      manager: req?.user?.manager,
    });

    campaignReq.save().then(async (result) => {
      // notify associate manager
      await Notification.create({
        targetRole: "MANAGER",
        managerInfo: req?.user?.manager,
        heading: `${req?.user?.name} requested for Offer #${requestData?.campaignId}`,
        type: "offer_request",
        link: `/campaign-request`,
      });
      // notify admin
      await Notification.create({
        targetRole: "ADMIN",
        heading: `${req?.user?.name} requested for Offer #${requestData?.campaignId}`,
        type: "offer_request",
        link: `/campaign-request`,
      });

      return res.status(200).json({
        message: "Offer request sent",
      });
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

//get campaign request
router.get("/", auth(["ADMIN", "MANAGER"]), async (req, res) => {
  try {
    const matchStage = {};
    if (req?.user?.role === "MANAGER") {
      matchStage.manager = req?.user?._id;
    }

    const pipeline = [
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: "campaigns",
          localField: "campaign",
          foreignField: "_id",
          as: "campaign",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userInfo",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $addFields: {
          campaign: { $arrayElemAt: ["$campaign", 0] },
          userInfo: { $arrayElemAt: ["$userInfo", 0] },
        },
      },
      {
        $project: {
          _id: 1,
          campaignId: "$campaign.campaignId",
          campaignName: "$campaign.campaignName",
          imageURL: "$campaign.imageData.imageUrl",
          trafficType: "$campaign.trafficType",
          userId: "$userInfo.userId",
          userName: "$userInfo.name",
          status: 1,
          createdAt: 1,
        },
      },
    ];

    const requests = await AffiliationRequest.aggregate(pipeline);

    return res.status(200).json(requests);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

//get pending request
router.get("/pending-request", auth(["ADMIN", "MANAGER"]), async (req, res) => {
  try {
    const filter = { status: "pending" };
    if (req?.user?.role === "MANAGER") {
      filter.manager = req?.user?._id;
    }
    const requestCount = await AffiliationRequest.countDocuments(filter);

    return res.status(200).json({
      dataCount: requestCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

//get single campaign request
router.get("/single/:id", auth(["ADMIN", "MANAGER", "USER"]), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await AffiliationRequest.findById(id).populate([
      { path: "campaign" },
      { path: "userInfo", select: "-password" },
    ]);

    return res.status(200).json({
      request: result,
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

//patch campaign request
router.patch("/:id", auth(["ADMIN", "MANAGER"]), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const request = await AffiliationRequest.findById(id).populate([
      { path: "campaign" },
      { path: "userInfo" },
    ]);

    if (!request) {
      return res.status(404).json({ message: "No request found!" });
    }
    if (request && request?.campaign.status !== "active") {
      return res.status(406).json({ message: "offer is not active now!" });
    }

    if (req?.user?.role === "MANAGER" && !req?.user?._id.equals(request?.manager)) {
      return res.status(406).json({ message: "Unauthorized access" });
    }

    const updatedDoc = { status };

    if (status === "approved") {
      const encodedUserId = mySimpleEncoder(request?.userInfo?.userId);
      const approvalUrl = `?offerId=${request?.campaign?.campaignId}&affId=${encodedUserId}`;
      updatedDoc.approvalUrl = approvalUrl;
      updatedDoc.approvedAt = new Date();
    }
    if (status === "rejected") {
      updatedDoc.approvalUrl = "";
    }

    const result = await AffiliationRequest.findOneAndUpdate(
      { _id: id },
      { ...updatedDoc },
      { upsert: false, new: true }
    ).populate([{ path: "campaign", select: "campaignId" }]);

    // notify user
    if (result) {
      await Notification.create({
        targetRole: "USER",
        userInfo: result?.userInfo,
        heading: `Offer request for #${result?.campaign?.campaignId} is ${result?.status}`,
        type: "offer_request",
        link:
          result?.status === "approved"
            ? `/approved-offers/${result?.campaign?.campaignId}`
            : `/offerwall/${result?.campaign?.campaignId}`,
      });
    }
    res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

module.exports = router;

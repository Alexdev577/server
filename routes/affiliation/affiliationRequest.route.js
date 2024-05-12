// require
const express = require("express");
const AffiliationRequest = require("../../models/AffiliationRequest.model");
const Campaign = require("../../models/Campaign.model");
const User = require("../../models/User.model");
const Notification = require("../../models/Notification.model");
const auth = require("../../middleware/auth");
const { mySimpleEncoder } = require("../../utilities/encoderDecoder.js");
const Setting = require("../../models/Setting.model");

// router
const router = express.Router();

// post campaign request
router.post("/", auth(["USER"]), async (req, res) => {
  const requestData = req.body;

  try {
    const userInfo = await User.findById(req.user._id);
    if (!userInfo || userInfo?.status !== "active") {
      return res.status(404).json({ message: "unauthorized access!" });
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
      campaign: requestData?.campaign,
      userInfo: req?.user?._id,
    });

    campaignReq.save().then(async (result) => {
      // admins action log
      await Notification.create({
        targetRole: "MANAGER",
        managerInfo: userInfo?.manager,
        heading: `${userInfo?.name} requested for Offer #${requestData?.campaignId}`,
        type: "offer_request",
        link: `/campaign-request`,
      });

      return res.status(200).json({
        message: "Offer request created!",
      });
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

//get campaign request
router.get("/", auth(["ADMIN", "MANAGER"]), async (req, res) => {
  try {
    const requestCount = await AffiliationRequest.countDocuments();
    const result = await AffiliationRequest.find().populate([
      { path: "campaign" },
      { path: "userInfo", select: "name userName email imageData socialLink status" },
    ]);

    return res.status(200).json({
      allData: result,
      dataCount: requestCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

//get pending request
router.get("/pending-request", async (req, res) => {
  try {
    const requestCount = await AffiliationRequest.find({
      status: { $eq: "pending" },
    }).countDocuments();

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

    const updatedDoc = { status };
    const { domainName } = await Setting.findById(null);

    if (status === "approved") {
      const encodedUserId = mySimpleEncoder(request?.userInfo?.userId);
      const approvalUrl = `${domainName}?offerId=${request?.campaign?.campaignId}&affId=${encodedUserId}`;
      updatedDoc.approvalUrl = approvalUrl;
      updatedDoc.approvedAt = new Date();
    }

    const result = await AffiliationRequest.findOneAndUpdate(
      { _id: id },
      { ...updatedDoc },
      { upsert: true, new: true }
    ).populate([{ path: "campaign", select: "campaignId" }]);

    // admins action log
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

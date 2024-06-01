const Campaign = require("../../models/Campaign.model");
const Affiliation = require("../../models/AffiliationRequest.model");
const AffiliationRequest = require("../../models/AffiliationRequest.model");
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { cleanUrl } = require("../../utilities/dataCleaning");
const auth = require("../../middleware/auth");

//get public offer details
router.get("/offer-details", async (req, res) => {
  if (!cleanUrl(req.originalUrl)) {
    return res.status(400).json({ message: "bad request" });
  }
  try {
    const offerDetails = await Campaign.find().select(
      "-_id campaignId campaignName category price previewLink countries description"
    );

    res.status(200).json(offerDetails);
  } catch (err) {
    res.status(500).json({ message: err?.message });
  }
});

//get list of campaigns
router.get("/list", auth(["ADMIN", "MANAGER"]), async (req, res) => {
  if (!cleanUrl(req.originalUrl)) {
    return res.status(400).json({ message: "bad request" });
  }
  try {
    const allCampaign = await Campaign.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      allData: allCampaign,
    });
  } catch (err) {
    res.status(500).json({ message: err?.message });
  }
});

//get filtered campaigns
router.get("/", auth(["USER", "MANAGER", "ADMIN"]), async (req, res) => {
  if (!cleanUrl(req.originalUrl)) {
    return res.status(400).json({ message: "bad request" });
  }

  const { offer, category, conversionType, country, platform } = req.query;
  try {
    let filter = {};

    if (offer) {
      filter = {
        $or: [
          {
            campaignId: {
              $regex: offer,
            },
          },
          {
            campaignName: {
              $regex: offer,
              $options: "i",
            },
          },
        ],
      };
    }
    if (category && category !== "all") {
      filter.category = category;
    }
    if (conversionType && conversionType !== "all") {
      filter.conversionType = conversionType;
    }
    if (platform && platform !== "all") {
      filter.deviceType = platform;
    }
    if (country) {
      if (country === "Any country") {
        filter.countries = {
          $nin: [],
        };
      } else {
        const countryArray = country.split(",");
        filter.countries = {
          $in: countryArray,
        };
      }
    }
    const allCampaign = await Campaign.find(filter).sort({
      createdAt: -1,
    });

    res.status(200).json(allCampaign);
  } catch (err) {
    res.status(500).json({ message: err?.message });
  }
});

//get filtered approved offers for user
router.get("/approved/:id", auth(["ADMIN", "MANAGER", "USER"]), async (req, res) => {
  const { id } = req.params;
  const { offer, category, conversionType, country, platform } = req.query;

  try {
    let countryArray;
    if (country) {
      countryArray = country.split(",");
    }

    const pipeline = [
      {
        $match: {
          userInfo: new ObjectId(id),
          status: "approved",
        },
      },
      {
        $lookup: {
          from: "campaigns",
          localField: "campaign",
          foreignField: "_id",
          as: "offerData",
        },
      },
      {
        $addFields: {
          offerData: { $arrayElemAt: ["$offerData", 0] },
        },
      },
      {
        $match: {
          $and: [
            offer
              ? {
                $or: [
                  { "offerData.campaignId": { $eq: offer } },
                  { "offerData.campaignName": { $regex: offer, $options: "i" } },
                ],
              }
              : {},
            category && category !== "all" ? { "offerData.category": category } : {},
            conversionType && conversionType !== "all"
              ? { "offerData.conversionType": conversionType }
              : {},
            platform && platform !== "all" ? { "offerData.deviceType": platform } : {},
            country ? { "offerData.countries": { $in: countryArray } } : {},
          ],
        },
      },
      {
        $project: {
          _id: "$_id",
          imageData: { imageUrl: "$offerData.imageData.imageUrl" },
          campaignId: "$offerData.campaignId",
          campaignName: "$offerData.campaignName",
          category: "$offerData.category",
          conversionType: "$offerData.conversionType",
          offerActivityStatus: "$offerData.status",
          approvedAt: "$approvedAt",
          countries: "$offerData.countries",
          price: "$offerData.price",
          offerApprovalStatus: "$status",
        },
      },
    ];
    const result = await AffiliationRequest.aggregate(pipeline);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

//get single campaigns data
router.get("/single/:id", auth(["ADMIN", "MANAGER", "USER"]), async (req, res) => {
  if (!cleanUrl(req.originalUrl)) {
    return res.status(400).json({ message: "bad request" });
  }
  const { id } = req.params;

  try {
    let campaignData;
    let requestData;

    const isValidId = mongoose.Types.ObjectId.isValid(id);

    if (isValidId) {
      campaignData = await Campaign.findOne({ _id: id });
    } else {
      campaignData = await Campaign.findOne({ campaignId: id });
    }
    if (req?.user?.role === "USER") {
      requestData = await Affiliation.findOne({
        campaign: campaignData?._id,
        userInfo: req?.user?._id,
      });
    }

    res.status(200).json({
      campaignData,
      requestData,
    });
  } catch (err) {
    res.status(500).json({ message: err?.message });
  }
});

module.exports = router;

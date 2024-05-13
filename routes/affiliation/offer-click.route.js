// require
const express = require("express");
const AffiliationClick = require("../../models/AffiliationClick.model");
const AdAffiliationClick = require("../../models/AdAffiliationClick.model");
const AffiliationRequest = require("../../models/AffiliationRequest.model");
const Campaign = require("../../models/Campaign.model");
const SmartLink = require("../../models/SmartLink.model");
const User = require("../../models/User.model");
const crypto = require("crypto");
const auth = require("../../middleware/auth");
const { mySimpleDecoder } = require("../../utilities/encoderDecoder.js");

// router
const router = express.Router();

// post offer click
router.post("/", async (req, res) => {
  const { ip, country, offerId, affId } = req.body;

  try {
    const userId = mySimpleDecoder(affId);
    const userInfo = await User.findOne({ userId });

    let campaignInfo;
    if (offerId === "0001") {
      campaignInfo = await SmartLink.findOne({ campaignId: offerId });

      if (!campaignInfo || !userInfo) {
        return res.status(404).json({ message: "Offer not found!" });
      }
    } else {
      campaignInfo = await Campaign.findOne({ campaignId: offerId });

      if (!campaignInfo || !userInfo) {
        return res.status(404).json({ message: "Offer not found!" });
      }
      const offerRequest = await AffiliationRequest.findOne({
        campaign: campaignInfo?._id,
        userInfo: userInfo?._id,
      });

      if (!offerRequest || offerRequest?.status !== "approved") {
        return res.status(404).json({ message: "no active affiliation found!" });
      }
    }

    const transId = await generateTransId();

    const campaignUrl = campaignInfo?.campaignUrl
      ?.replace("{trans_id}", transId)
      .replace("{aff_id}", userId);

    // post click to admin click collection
    const admin_aff_click = new AdAffiliationClick({
      campaignInfo: campaignInfo?._id,
      offerId: offerId,
      offerName: campaignInfo?.campaignName,
      price: campaignInfo?.price,
      campaignUrl,
      transactionId: transId,
      userInfo: userInfo?._id,
      userId: userInfo?.userId,
      ipAddress: ip,
      country,
    });
    await admin_aff_click.save();

    // post click to user click collection
    const aff_click = new AffiliationClick({
      campaignInfo: campaignInfo?._id,
      offerId: offerId,
      offerName: campaignInfo?.campaignName,
      price: campaignInfo?.price,
      campaignUrl,
      transactionId: transId,
      userInfo: userInfo?._id,
      userId: userInfo?.userId,
      ipAddress: ip,
      country,
    });
    await aff_click.save();

    res.status(200).send({ url: campaignUrl });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error?.message });
  }
});

// post custome offer click
router.post("/custom-click", auth(["ADMIN"]), async (req, res) => {
  const data = req.body;

  try {
    // ------------ find user info ------------ //
    const userInfo = await User.findOne({ userId: data?.userId });

    // ------------ find campaign info and handle errors ------------ //
    let campaignInfo;
    if (data?.offerId === "0001") {
      campaignInfo = await SmartLink.findOne({ campaignId: data?.offerId });

      if (!campaignInfo || !userInfo) {
        return res.status(404).json({ message: "Offer not found!" });
      }
    } else {
      campaignInfo = await Campaign.findOne({ campaignId: data?.offerId });

      if (!campaignInfo || !userInfo) {
        return res.status(404).json({ message: "Offer not found!" });
      }
      const offerRequest = await AffiliationRequest.findOne({
        campaign: campaignInfo?._id,
        userInfo: userInfo?._id,
      });
      if (!offerRequest || offerRequest?.status !== "approved") {
        return res.status(404).json({ message: "no active affiliation found!" });
      }
    }

    const clicks = [];

    for (let i = 0; i < data?.clicks; i++) {
      const transId = await generateTransId();

      const campaignUrl = campaignInfo?.campaignUrl
        ?.replace("{trans_id}", transId)
        .replace("{aff_id}", data?.userId);

      if (i < data?.leads) {
        clicks.push({
          campaignInfo: campaignInfo?._id,
          offerId: campaignInfo?.campaignId,
          offerName: campaignInfo?.campaignName,
          campaignUrl,
          transactionId: transId,
          userInfo: userInfo?._id,
          userId: userInfo?.userId,
          ipAddress: data?.ipAddress,
          country: data?.country,
          status: data?.status,
          price: campaignInfo?.price || data?.price,
          createdAt: new Date(data?.dateValue),
          updatedAt: new Date(data?.dateValue),
          lead: 1,
        });
      } else {
        clicks.push({
          campaignInfo: campaignInfo?._id,
          offerId: campaignInfo?.campaignId,
          offerName: campaignInfo?.campaignName,
          campaignUrl,
          transactionId: transId,
          userInfo: userInfo?._id,
          userId: userInfo?.userId,
          ipAddress: data?.ipAddress,
          country: data?.country,
          status: data?.status,
          price: campaignInfo?.price || data?.price,
          createdAt: new Date(data?.dateValue),
          updatedAt: new Date(data?.dateValue),
        });
      }
    }

    const userClicked = await AffiliationClick.insertMany(clicks);
    const adminClicked = await AdAffiliationClick.insertMany(clicks);

    if (!adminClicked || !userClicked) {
      return res.status(406).json({ message: "Something went wrong!" });
    }

    res.status(200).json({ message: "Clicks added successfully" });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

// post offer-click apprval
router.post("/postback", async (req, res) => {
  const { transId, payout, status } = req.body;

  try {
    //------------ define data for update conditionally ------------//
    const updatedDoc = { lead: 1, updatedAt: new Date() };
    if (payout) {
      updatedDoc.price = parseInt(payout);
    }
    if (status) {
      updatedDoc.status = status;
    }
    //---------- save genuine data into admin collection ----------//
    const adminOfferClick = await AdAffiliationClick.findOneAndUpdate(
      {
        transactionId: transId,
      },
      updatedDoc,
      { upsert: false }
    );
    if (!adminOfferClick) {
      return res.status(404).json({ message: "Transaction details not found!" });
    }
    //---------- manipulate data and save into user collection ----------//
    let campaign;

    if (adminOfferClick?.offerId === "0001") {
      campaign = await SmartLink.findById(adminOfferClick?.campaignInfo);
    } else {
      campaign = await Campaign.findById(adminOfferClick?.campaignInfo);
    }

    if (!campaign) {
      return res.status(404).json({ message: "Transaction details not found!" });
    }

    //---------- apply admincut on price ----------//
    // let amount = 0;
    if (payout && campaign?.priceCut) {
      const adminCut = (payout / 100) * campaign?.priceCut;
      // const amount = payout - adminCut;
      updatedDoc.price = payout - adminCut;
    }
    //---------- apply commission/admincut on lead ----------//
    const counter = campaign?.counter;
    const commission = campaign?.commission / 10;

    if (counter > commission) {
      await AffiliationClick.findOneAndUpdate(
        {
          transactionId: transId,
        },
        updatedDoc,
        { upsert: false }
      );
    }
    // ---------- update counter ----------//
    if (campaign.counter === 10) {
      campaign.counter = 1;
      campaign.save();
    } else {
      campaign.counter += 1;
      campaign.save();
    }
    res.status(200).json({ message: "The postback well received!" });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

//conversion report status change(by admin)
router.patch("/status/:id", auth(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  updateData.updatedAt = new Date();

  try {
    // Find the manager by id field
    const exist = await AffiliationClick.findById(id);

    // check if the user exists
    if (!exist) {
      return res.status(404).json({ message: "Offer clink not found!" });
    }

    const result = await AffiliationClick.findOneAndUpdate({ _id: id }, updateData, {
      upsert: true,
      // new: true,
    });

    return res.status(200).json({
      result,
      message: "Status updated successfully!",
    });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

// generate a random string as transaction id of 16 digit
async function generateTransId() {
  const id = crypto.randomBytes(Math.ceil(18)).toString("hex").slice(0, 32);
  const exist = await AdAffiliationClick.findOne({
    transactionId: id,
  });

  if (exist) {
    generateTransId();
  } else {
    return id;
  }
}

module.exports = router;

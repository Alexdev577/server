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
const UserAccount = require("../../models/UserAccount.model.js");

const minFraud = require("@maxmind/minfraud-api-node");
const client = new minFraud.Client(process.env.MAXMIND_ACCOUNT_ID, process.env.MAXMIND_LICENSE_KEY);

// router
const router = express.Router();

// post offer click
router.post("/", async (req, res) => {
  const { ip, country, offerId, affId } = req.body;

  try {
    // ------------ find user info ------------ //
    const userId = mySimpleDecoder(affId);
    const userInfo = await User.findOne({ userId });

    if (!userInfo || userInfo?.status !== "active") {
      return res.status(404).json({ message: "No active user found" });
    }
    // ------------ find campaign info and handle errors ------------ //
    let campaignInfo;
    if (offerId === "0001") {
      campaignInfo = await SmartLink.findOne({ campaignId: offerId });

      if (!campaignInfo || campaignInfo?.status !== "active") {
        return res.status(404).json({ message: "No active offer found" });
      }
    } else {
      campaignInfo = await Campaign.findOne({ campaignId: offerId });

      if (!campaignInfo || campaignInfo?.status !== "active") {
        return res.status(404).json({ message: "No active offer found" });
      }

      const offerRequest = await AffiliationRequest.findOne({
        campaign: campaignInfo?._id,
        userInfo: userInfo?._id,
      });

      if (!offerRequest || offerRequest?.status !== "approved") {
        return res.status(404).json({ message: "No active affiliation found!" });
      }
    }

    const transId = await generateTransId();

    const campaignUrl = campaignInfo?.campaignUrl
      ?.replace("{trans_id}", transId)
      ?.replace("{aff_id}", userId);

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
      manager: userInfo?.manager,
      postbackUrl: userInfo?.postbackUrl,
      ipAddress: ip ?? "",
      country: country ?? "",
      createdAt: new Date(),
      updatedAt: new Date(),
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
      manager: userInfo?.manager,
      postbackUrl: userInfo?.postbackUrl,
      ipAddress: ip ?? "",
      country: country ?? "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await aff_click.save();

    res.status(200).json({ url: campaignUrl });
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
    if (!userInfo || userInfo?.status !== "active") {
      return res.status(404).json({ message: "No active user found" });
    }

    // ------------ find campaign info and handle errors ------------ //
    let campaignInfo;
    if (data?.offerId === "0001") {
      campaignInfo = await SmartLink.findOne({ campaignId: data?.offerId });

      if (!campaignInfo || campaignInfo?.status !== "active") {
        return res.status(404).json({ message: "No active offer found" });
      }
    } else {
      campaignInfo = await Campaign.findOne({ campaignId: data?.offerId });

      if (!campaignInfo || campaignInfo?.status !== "active") {
        return res.status(404).json({ message: "No active offer found" });
      }

      const offerRequest = await AffiliationRequest.findOne({
        campaign: campaignInfo?._id,
        userInfo: userInfo?._id,
      });

      if (!offerRequest || offerRequest?.status !== "approved") {
        return res.status(404).json({ message: "No active affiliation found!" });
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
          manager: userInfo?.manager,
          postbackUrl: userInfo?.postbackUrl,
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
          manager: userInfo?.manager,
          postbackUrl: userInfo?.postbackUrl,
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

    const price = campaignInfo?.price || data?.price;
    const totalAmount = parseFloat(price) * parseInt(data?.leads);
    const account = await UserAccount.findOne({ userOid: userInfo?._id });

    if (!account && data?.status === "approved" && totalAmount > 0) {
      await UserAccount.create({
        userOid: userInfo?._id,
        totalRevenue: totalAmount,
        currentBalance: totalAmount,
      });
    }
    if (account && data?.status === "approved" && totalAmount > 0) {
      account.totalRevenue += totalAmount;
      account.currentBalance += totalAmount;
      await account.save();
    }

    if (!adminClicked || !userClicked) {
      return res.status(500).json({ message: "Something went wrong!" });
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
    const updatedDoc = { lead: 1, status: "approved", updatedAt: new Date() };
    if (payout) {
      updatedDoc.price = parseFloat(payout);
    }
    if (status) {
      updatedDoc.status = status;
    }
    //---------- save genuine data into admin-clicks collection ----------//
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
    // get device minFraud score
    const fraudScore = await getMinFraudScore(adminOfferClick?.ipAddress);
    updatedDoc.fraudScore = fraudScore;

    //---------- manipulate data and save into user collection ----------//
    let campaign;
    if (adminOfferClick?.offerId === "0001") {
      campaign = await SmartLink.findById(adminOfferClick?.campaignInfo);
    } else {
      campaign = await Campaign.findById(adminOfferClick?.campaignInfo);
    }

    if (!campaign) {
      return res.status(404).json({ message: "No associated offer found!" });
    }

    //---------- apply commission on price if any----------//
    if (payout && campaign?.priceCut) {
      const adminCut = (payout / 100) * campaign?.priceCut;
      updatedDoc.price = payout - adminCut;
    }

    let userPostbackUrl = "";
    //---------- apply commission/admincut on lead ----------//
    const counter = campaign?.counter;
    const commission = campaign?.commission / 10;

    if (counter > commission) {
      const prevClickState = await AffiliationClick.findOne({
        transactionId: transId,
      });
      await AffiliationClick.findOneAndUpdate(
        {
          transactionId: transId,
        },
        updatedDoc,
        { upsert: false, new: true }
      ).then(async (result) => {
        if (!result) {
          return res.status(500).json({ message: "Something went wrong!" });
        }

        if (result.postbackUrl) {
          userPostbackUrl = result?.postbackUrl
            ?.replace("{trans_id}", transId)
            ?.replace("{payout}", payout ?? "")
            ?.replace("{status}", status ?? "")
            ?.replace("{sub_id}", result?.userId ?? "")
            ?.replace("{ip_address}", result?.ipAddress ?? "")
            ?.replace("{country}", result?.country ?? "");
        }

        const account = await UserAccount.findOne({ userOid: result?.userInfo });

        if (!account && updatedDoc?.status === "approved") {
          await UserAccount.create({
            userOid: result?.userInfo,
            totalRevenue: parseFloat(result?.price),
            currentBalance: parseFloat(result?.price),
          });
        }
        if (account && updatedDoc?.status === "approved") {
          if (prevClickState?.status === "approved") {
            account.totalRevenue =
              account.totalRevenue - prevClickState?.price + parseFloat(result?.price);
            account.currentBalance =
              account.currentBalance - prevClickState?.price + parseFloat(result?.price);
            await account.save();
          } else {
            account.totalRevenue += parseFloat(result?.price);
            account.currentBalance += parseFloat(result?.price);
            await account.save();
          }
        }
      });
    }
    // ---------- update counter ----------//
    if (updatedDoc?.status === "approved") {
      if (campaign.counter === 10) {
        campaign.counter = 1;
        await campaign.save();
      } else {
        campaign.counter += 1;
        await campaign.save();
      }
    }
    res.status(200).json({ userPostbackUrl, message: "The postback well received!" });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

//conversion report status change(by admin)
router.patch("/status/:id", auth(["ADMIN", "MANAGER"]), async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  updateData.updatedAt = new Date();

  try {
    // check if the Transactin details exists
    const exist = await AffiliationClick.findById(id);

    if (!exist) {
      return res.status(404).json({ message: "Transaction details not found!" });
    }

    await AffiliationClick.findOneAndUpdate({ _id: id }, updateData, {
      upsert: false,
      new: true,
    }).then(async (result) => {
      if (!result) {
        return res.status(500).json({ message: "Couldn't update status!" });
      }
      const account = await UserAccount.findOne({ userOid: exist?.userInfo });

      if (exist?.status === "approved" && updateData.status !== "approved") {
        account.currentBalance -= parseFloat(exist?.price);
        account.totalRevenue -= parseFloat(exist?.price);
        await account.save();
      } else if (exist?.status !== "approved" && updateData.status === "approved") {
        if (!account) {
          await UserAccount.create({
            userOid: exist?.userInfo,
            totalRevenue: parseFloat(exist?.price),
            currentBalance: parseFloat(exist?.price),
          });
        } else {
          account.totalRevenue += parseFloat(exist?.price);
          account.currentBalance += parseFloat(exist?.price);
          await account.save();
        }
      }
    });

    return res.status(200).json({ message: "Status updated successfully!" });
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

// get minFraud Score from MaxMind
const getMinFraudScore = async (ipString) => {
  const transaction = new minFraud.Transaction({
    device: new minFraud.Device({
      ipAddress: ipString,
    }),
  });
  try {
    const result = await client.score(transaction);
    // console.log("response=>", result);
    return result?.riskScore;
  } catch (error) {
    console.error("error=>", error);
  }
};

module.exports = router;

// project import
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// parser data
const corsOptions = {
  origin: [
    "https://affburg.com/",
    "https://admin.affburg.com/",
    "https://affburg-main.vercel.app/",
    "https://affburg-admin-panel.vercel.app/",
    "http://localhost:3000/",
    "http://localhost:3001/",
    "*",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGODB_URI, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("DB connected...");
});

// Token verification
const tokenVerification = require("./routes/tokenVerification.route");
app.use("/verify-token", tokenVerification);

// settings
const setting = require("./routes/settings.route");
app.use("/setting", setting);

// users
const userSignUp = require("./routes/user/userSignup.route");
const userSignIn = require("./routes/user/userSignin.route");
const getUser = require("./routes/user/getUser.route");
const updateUser = require("./routes/user/updateUser.route");
const userAction = require("./routes/user/userAction.route");
app.use("/user-signup", userSignUp);
app.use("/user-signin", userSignIn);
app.use("/get-user", getUser);
app.use("/patch-user", updateUser);
app.use("/user-action", userAction);

// account and payments
const userAccount = require("./routes/accountAndPayment/userAcount.route");
const paymentMethod = require("./routes/accountAndPayment/paymentMethod.route");
const invoiceAndPayments = require("./routes/accountAndPayment/invoiceAndPayments");
app.use("/user-account", userAccount);
app.use("/payment", paymentMethod);
app.use("/invoice", invoiceAndPayments);

// admin
// const adminSignIn = require("./routes/admin/adminSignin.route");
// app.use("/admin-signin", adminSignIn);

// manager
const managerSingin = require("./routes/manager/managerSignin.route");
const postManager = require("./routes/manager/postManager.route");
const getManager = require("./routes/manager/getManager.route");
const patchManager = require("./routes/manager/patchManager.route");
const deleteManager = require("./routes/manager/deleteManager.route");
app.use("/manager-signin", managerSingin);
app.use("/post-manager", postManager);
app.use("/get-manager", getManager);
app.use("/patch-manager", patchManager);
app.use("/delete-manager", deleteManager);

// Notification
const getNotification = require("./routes/notification/getNotification.route");
const patchNotification = require("./routes/notification/patchNotification.route");
app.use("/get-notification", getNotification);
app.use("/patch-notification", patchNotification);

//Campaign category
const campaignCategory = require("./routes/campaign/campaignCategory.route");
app.use("/campaign-category", campaignCategory);

//Conversion Type
const conversionType = require("./routes/campaign/conversionType.route");
app.use("/conversion-type", conversionType);

//Traffic Type
const trafficType = require("./routes/campaign/trafficType.route");
app.use("/traffic-type", trafficType);

// Campaign
const postCampaign = require("./routes/campaign/postCampaign.route");
const patchCampaign = require("./routes/campaign/patchCampaign.route");
const getCampaign = require("./routes/campaign/getCampaign.route");
const deleteCampaign = require("./routes/campaign/deleteCampaign.route");
app.use("/post-campaign", postCampaign);
app.use("/patch-campaign", patchCampaign);
app.use("/get-campaign", getCampaign);
app.use("/delete-campaign", deleteCampaign);

//SmartLinks
const smartLink = require("./routes/smartLink/smartLink.route");
app.use("/smartLink", smartLink);

// Affiliation
const affiliationRequest = require("./routes/affiliation/affiliationRequest.route");
const offerClick = require("./routes/affiliation/offer-click.route");
const getOfferClick = require("./routes/affiliation/getOfferClick.route");
app.use("/affiliation-request", affiliationRequest);
app.use("/offer-click", offerClick);
app.use("/get-offer-click", getOfferClick);

//top
const topCampaign = require("./routes/top/topCampaign.route");
const topAffiliates = require("./routes/top/topAffiliates.route");
app.use("/top-campaign", topCampaign);
app.use("/top-affiliate", topAffiliates);

app.get("/", (req, res) => {
  res.status(200).send("Affburg server is running...");
});

const { sendEmail } = require("./utilities/mailer");
app.get("/test-api", async (req, res) => {
  // const token = await generateHashToken("416416141651316316").catch((err) => console.log(err));

  // const emailData = generateMailSubjectAndMessage({
  //   emailType: "verify-email",
  //   name: "Adif Khan",
  //   activationCode: "416416",
  //   token: "6544164161368411",
  // });

  // sendEmail({
  //   name: "Jubair Ahmed Tolon",
  //   email: "pkadif@gmail.com",
  //   activationCode: "165435",
  //   token: "14984168461561865654",
  //   emailType: "verify-email",
  // })
  //   .then((res) => console.log("mail res", res))
  //   .catch((err) => console.log("mail err", err));

  res.status(200).send({ message: "testing purposes" });
});

module.exports = app;

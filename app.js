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
    "https://adm.affburg.com/",
    "https://affburg-main.vercel.app/",
    "https://affburg-admin-panel.vercel.app/",
    "http://localhost:3000/",
    "http://localhost:3001/",
    "*",
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
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

// manager
const managerSingin = require("./routes/manager/managerSignin.route");
const getManager = require("./routes/manager/getManager.route");
const managerActions = require("./routes/manager/managerActions.route");
const loginAsUser = require("./routes/manager/loginAsUser.route");
app.use("/manager-signin", managerSingin);
app.use("/get-manager", getManager);
app.use("/manager", managerActions);
app.use("/login-as-user", loginAsUser);

// Token verification
const tokenVerification = require("./routes/tokenVerification.route");
app.use("/verify-token", tokenVerification);

// settings
const setting = require("./routes/settings.route");
app.use("/setting", setting);

// Notification
const notification = require("./routes/notification/notification.route");
app.use("/notification", notification);

// user feedback through email
const feedback = require("./routes/feedback");
app.use("/send-feedback", feedback);

// account and payments
const userAccount = require("./routes/accountAndPayment/userAcount.route");
const paymentMethod = require("./routes/accountAndPayment/paymentMethod.route");
const invoiceAndPayments = require("./routes/accountAndPayment/invoiceAndPayments");
app.use("/user-account", userAccount);
app.use("/payment", paymentMethod);
app.use("/invoice", invoiceAndPayments);

//Campaign category
const campaignCategory = require("./routes/campaign/campaignCategory.route");
app.use("/campaign-category", campaignCategory);

//Advertiser
const advertiser = require("./routes/campaign/advertiser.route");
app.use("/advertiser", advertiser);

//Conversion Type
const conversionType = require("./routes/campaign/conversionType.route");
app.use("/conversion-type", conversionType);

//Traffic Type
const trafficType = require("./routes/campaign/trafficType.route");
app.use("/traffic-type", trafficType);

// Campaign
const campaignActions = require("./routes/campaign/campaignActions.route");
const getCampaign = require("./routes/campaign/getCampaign.route");
app.use("/campaign", campaignActions);
app.use("/get-campaign", getCampaign);

//SmartLinks
const smartLink = require("./routes/smartLink/smartLink.route");
app.use("/smartLink", smartLink);

// Affiliation
const affiliationRequest = require("./routes/affiliation/affiliationRequest.route");
const offerClick = require("./routes/affiliation/offer-click.route");
const getReport = require("./routes/affiliation/getReport.route");
app.use("/affiliation-request", affiliationRequest);
app.use("/offer-click", offerClick);
app.use("/get-report", getReport);

// top affiliates and top campaigns
const topCampaign = require("./routes/top/topCampaign.route");
const topAffiliates = require("./routes/top/topAffiliates.route");
app.use("/top-campaign", topCampaign);
app.use("/top-affiliate", topAffiliates);

// PostbackURLs
const postbackUrl = require("./routes/postbackUrls/postbackUrls.route");
app.use("/postback-url", postbackUrl);

app.get("/", (req, res) => {
  res.status(200).send("Affburg server is running...");
});

const AffiliationClick = require("./models/AffiliationClick.model");
app.get("/test-api", async (req, res) => {
  res.status(200).send({ message: "testing purposes" });
});

module.exports = app;

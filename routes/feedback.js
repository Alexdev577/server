const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

// update settings
router.post("/", async (req, res) => {
  const data = req.body;

  try {
    const message = `<div>
            <p>Name: <strong>${data?.name}</strong></p>
            <p>Email: <strong>${data?.email}</strong></p>
            <p>${data?.message}</p>
            </div>`;

    // Create a transporter object using SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.HOST_NAME,
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.PASSWORD,
      },
    });

    // Define email options
    const mailOptions = {
      from: process.env.EMAIL_ADDRESS,
      to: process.env.SUPPORT_EMAIL,
      subject: data?.subject,
      html: message,
    };

    // Send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error occurred :", error);
      } else {
        console.log("Message ID:", info.messageId);
        console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
      }
    });

    res.status(200).json({ message: "Thanks for your valuable feedback" });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;

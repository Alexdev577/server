const nodemailer = require("nodemailer");
const { generateMailSubjectAndMessage } = require("./mailHelper");

const sendEmail = async ({ email, name, token, emailType, accountStatus }) => {
  return new Promise((resolve, reject) => {
    try {
      const emailData = generateMailSubjectAndMessage({
        name,
        emailType,
        token,
        accountStatus,
      });

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
      // const transporter = nodemailer.createTransport({
      //   host: "smtp.gmail.com",
      //   port: 587,
      //   secure: false,
      //   // port: 465,
      //   // secure: true,
      //   auth: {
      //     user: process.env.EMAIL_ADDRESS,
      //     pass: process.env.PASSWORD,
      //   },
      // });

      // Define email options
      const mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to: email,
        subject: emailData?.subject,
        html: emailData?.message,
      };

      // Send mail with defined transport object
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          // console.error("Error occurred :", error);
          reject(error);
        } else {
          // console.log("Message ID:", info.messageId);
          // console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
          resolve(info);
        }
      });
    } catch (error) {
      // console.log(error);
      reject(error);
    }
  });
};

module.exports = { sendEmail };

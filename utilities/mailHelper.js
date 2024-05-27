const bcrypt = require("bcrypt");

const generateHashToken = async (plainText) => {
  return new Promise((resolve, reject) => {
    try {
      bcrypt.hash(plainText, 10, async (err, hash) => {
        if (err) {
          reject("Error occurred while generating hash");
          return;
        }
        resolve(hash);
      });
    } catch (error) {
      reject(error);
    }
  });
};

const generateMailSubjectAndMessage = ({ emailType, name, token, accountStatus }) => {
  let data = {};
  switch (emailType) {
    case "verify-email":
      data = {
        subject: "Email Verification",
        message: `<div>
            <p>Dear <strong>${name}</strong></p>
            <p>Thank you for registering at <strong>affburg.com</strong>. To activate your account and complete your registration click on the link: </p>
            <a href=${process.env.DOMAIN}verify-user?token=${token} target='_blank'>${process.env.DOMAIN}verify-user?token=${token}</a>
            <p>If you did not sign up for an account with <strong>affburg.com</strong>, please ignore this email.</p>
            <br />
            <p>Thank you,</p>
            <p>Admin, Affburg.com</p>
            </div>`,
      };
      break;
    case "reset-password":
      data = {
        subject: "Reset Password",
        message: `<div>
        <p>Dear <strong>${name}</strong></p>
        <p>Click on the link below to reset your password: </p>
        <a href=${process.env.DOMAIN}set-new-password?token=${token} target='_blank'>${process.env.DOMAIN}set-new-password?token=${token}</a>
        <p>If you didn't request for password reset, please ignore this email.</p>
        <br />
        <p>Thank you,</p>
        <p>Admin, Affburg.com</p>
        </div>`,
      };
      break;
    case "account-status":
      data = {
        subject:
          accountStatus === "active"
            ? "Your Account is Activated"
            : accountStatus === "banned"
            ? "Your Account is Banned"
            : "Your Account is Pending",
        message: `<div>
        <p>Dear <strong>${name}</strong></p>
        ${
          accountStatus === "active"
            ? `<p>
              Thank you for registering at <strong>affburg.com</strong>. Your account is now active.
              You can start exploring our platform right away! 
            </p>
            <p>
            For more information, please contact your manager.
            </p>`
            : accountStatus === "banned"
            ? `<p>
                We regret to inform you that your account with affburg.com has been banned due to
                violations of our terms of service.
                </p>
                <p>
                 For more information, please contact your manager.
              </p>`
            : `<p>
              Thank you for registering at <strong>affburg.com</strong>. Your account is pending.
              </p>
              <p>
              For more information, please contact your manager.
              </p>`
        }
        <br />
        <p>Thank you,</p>
        <p>Admin, Affburg.com</p>
        </div>`,
      };
      break;
    default:
      break;
  }
  return data;
};

module.exports = { generateHashToken, generateMailSubjectAndMessage };

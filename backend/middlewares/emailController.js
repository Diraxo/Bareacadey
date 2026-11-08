const nodemailer = require('nodemailer');
var handlebars = require('handlebars');
var fs = require('fs');
require('../config/loadEnv')

// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   secure: true,
//   auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASSWORD,
//     },
//     //   tls: {
//     //     ciphers:'SSLv3'
//     //   }
// });

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});


    var readHTMLFile = function(path, callback) {
      fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
          if (err) {
             callback(err);                 
          }
          else {
              callback(null, html);
          }
      });
    };

const sendEmailLink = ({send_to, token,  type="verify-email", username = ""}) => {
  const frontendUrl = process.env.FRONTEND_URL
  
  return new Promise((resolve, reject) => {
    let message = ""
    let html = ""
    let subject = ""
    let path = (type==="verify-email") ? "verify_email.html" : (type=="new-device") ? "new_device.html" : (type=="reset-password") ? "reset_password.html" : (type=="first-time-password") ? "first_password_change.html" : (type=="sign-document") ? "sign_document.html" : "";
    readHTMLFile(__dirname + `/email_templates/${path}`, function(err, html) {
        if (err) {
          console.log('error reading file', err);
          return;
        }
        var template = handlebars.compile(html);
        const emailData = {
          title: 'Verify your account email',
          serviceName: 'Cellubooks',
          companyLogo: 'https://cellubooks.com/assets/logo-4jkCC9eN.png',
          username: username,
          verificationLink: (type=="reset-password" || type=="first-time-password") ? `${frontendUrl}/auth/reset?reset_token=${token}` : (type=="sign-document") ? `${frontendUrl}/main/sign?token=${token}` : `${frontendUrl}/auth/${type==="verify-email"?"verify_email":(type==="new-device")?"device_verified":""}?token=${token}`,
        };

        var htmlToSend = template(emailData);

      if(type === "verify-email") {
          message = "Verify Your Account"
          html = htmlToSend,
          subject = "Verify your account"
      }
      else if(type == "first-time-password") {
        message = "Change Your Account Password"
        html = htmlToSend,
        subject = "First Time Password Change"
      }
      else if(type=="reset-password") {
        message = "Reset your password"
        html = htmlToSend
        subject = "Reset your password"
      }
      else if(type == "new-device") {
        message = "New device login detected"
        html = htmlToSend,
        subject = "Verify you are the owner of this account"
      }
      else if(type=="sign-document") {
        message = "Sign the document"
        html = htmlToSend
        subject = "Sign the document"
      }
      const email_message = {
        from: { name: process.env.EMAIL_FRIENDLY_NAME, address: process.env.SMTP_USER },
        to: send_to,
        subject: subject,
        text: message, 
        html: html,
      };

      transporter.sendMail(email_message).then(() => {
        resolve(true);
      }).catch((error) => {
          console.log(error)
        reject(false);
      });

  });

  }).then(result => {
    return true
  })
  .catch(error => {
    return false
  });

}

const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/* One-time 6-digit password reset code for the mobile app. Resolves true/false and never throws. */
const sendResetCode = async ({ send_to, code, username = "" }) => {
  const name = escapeHtml(username) || 'there'
  const html = `<!DOCTYPE html><html><body style="margin:0;background:#f4f7f6;padding:24px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:460px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
      <div style="background:#021520;color:#fff;padding:22px 28px;"><div style="font-size:12px;letter-spacing:2px;color:#86efac;">LEARN · INFORM · INSPIRE</div><div style="font-size:22px;font-weight:700;margin-top:6px;">Bare Academy</div></div>
      <div style="padding:28px;color:#12201c;">
        <p style="margin:0 0 12px;font-size:16px;">Hi ${name},</p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.5;">Use this code to reset your password. It works for 15 minutes.</p>
        <div style="text-align:center;font-size:34px;letter-spacing:10px;font-weight:700;background:#e7f6ec;color:#0f7a37;border-radius:12px;padding:16px 0;">${escapeHtml(code)}</div>
        <p style="margin:20px 0 0;font-size:13px;color:#667874;line-height:1.5;">If you did not ask for this, you can ignore this email. Your password will not change.</p>
      </div>
    </div></body></html>`
  try {
    await transporter.sendMail({
      from: { name: process.env.EMAIL_FRIENDLY_NAME, address: process.env.SMTP_USER },
      to: send_to,
      subject: `${code} is your Bare Academy reset code`,
      text: `Your Bare Academy password reset code is ${code}. It works for 15 minutes.`,
      html,
    })
    return true
  } catch (error) {
    console.error('Reset code e-mail failed:', error?.message)
    return false
  }
}

module.exports = {sendEmailLink, sendResetCode}

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const User = require('../../models/User')
const Permission = require("../../models/Permission")
const Role = require("../../models/Role");
const Device = require("../../models/Device");
const InstructorRequest = require("../../models/InstructorRequest");
const devices = require("../../services/devices");
const UserUpload = require("../../models/UserUpload");
const Sequelize = require('sequelize')
const express = require('express');
const { sendEmailLink, sendResetCode } = require('../../middlewares/emailController');
const UserPermission = require('../../models/UserPermission');
const { effectivePermissions } = require('../../services/rolePermissions');
const route = express.Router()
const fs = require('fs');
const config = require('../../config');
const sessions = require('../../services/sessions');
const { fullNameFrom, legacyNameParts } = require('../../services/fullName');
const crypto = require('crypto');
const { loginLimiter, accountLoginLimiter, registerLimiter, forgotRequestLimiter, forgotResetLimiter, forgotAccountLimiter } = require('../../middlewares/rateLimit');
const { uploadFilesProfile } = require('../../middlewares/profileUpload');

/* Phone numbers are stored as "+251-9XXXXXXXX". People also type the local zero ("+251-09...") or leave out the dash,
 * so the lookup accepts the same number written in those ways. E-mail addresses and other usernames are used as typed. */
const identifierVariants = (value) => {
  const text = String(value || '').trim()
  const variants = new Set([text])
  const match = text.match(/^\+?(\d{1,3})[-\s]?(\d{6,12})$/)
  if (match) {
    const [, code, local] = match
    const bare = local.replace(/^0+/, '')
    variants.add(`+${code}-${bare}`)
    variants.add(`+${code}-0${bare}`)
    variants.add(`+${code}${bare}`)
  }
  return [...variants]
}

/* Where-clause for "the account this person typed": username written any of the ways above, a number typed without the
 * dash ("+251911000333"), or the e-mail address. */
const accountWhere = (identifier) => {
  const text = String(identifier || '').trim()
  const clauses = [
    { username: { [Sequelize.Op.in]: identifierVariants(text) } },
    { email: text },
  ]
  const compact = text.replace(/[\s-]/g, '')
  if (/^\+\d{7,15}$/.test(compact)) {
    clauses.push(Sequelize.where(Sequelize.fn('REPLACE', Sequelize.col('User.username'), '-', ''), compact))
  }
  return Sequelize.or(...clauses)
}

const maskEmail = (email) => {
  const [name, domain] = String(email || '').split('@')
  if (!name || !domain) return ''
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(2, Math.min(name.length - 2, 6)))}@${domain}`
}
/* Accounts created from a phone number before e-mail was collected got a placeholder address that cannot receive mail. */
const hasRealEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '')) && !/@(temp\.com|phone\.local)$/i.test(String(email))

route.post('/login', loginLimiter, accountLoginLimiter, async (req, res) => {
  try {
      const { userOrEmail, password, device } = req.body;
      // if(!device) return res.status(400).json({message: "You are not authorized to login"})
      if (!userOrEmail || !password) return res.status(400).json({ 'message': 'Both username/email and password are required.' });
      if (typeof userOrEmail !== 'string' || typeof password !== 'string') return res.status(400).json({ 'message': 'Both username/email and password are required.' });
      const user = await User.findOne({
         where: accountWhere(userOrEmail),
         include: [
          {
            model: Permission,
            attributes: [
              "permission",
            ],
            through: { attributes: [] },
          },
          {
            model: Role,
            as: "roles",
            attributes: [
              "role"
            ]
          },
          {
            model: UserUpload,
            as: "url",
            attributes: ["filepath"],
          }
        ] 
      });
      if(!user) return res.status(401).send({message: "Username Or Password Is Incorrect"})
      const isValidUser = await bcrypt.compare(
        password,
        user.password
      );
      if (!isValidUser) return res.status(401).send({message: "Username Or Password Is Incorrect"})
      if (user.active === false) return res.status(403).send({message: "This account has been deactivated"})
      
      const devices = await Device.findOne({
        where: {device: device??null, user_id: user.id}
      })

      /*
      if(user?.password_change_required) {
        const token = jwt.sign({id: user.id, device: device??null}, config.secrets.accessToken, { expiresIn: process.env.EMAIL_TOKEN_EXPIRES_IN, algorithm: 'HS256'} )
        user.reset_password_token = token
        await user.save()
        await sendEmailLink({send_to: user.email, token: token, type: "first-time-password", username: user?.full_name})
        return res.json({message: "We have sent you a password reset link to your email address, change your password first before using the system."})
      }


      if(!devices) {
         const token = jwt.sign({id: user.id, device: device??null}, config.secrets.accessToken, { expiresIn: process.env.EMAIL_TOKEN_EXPIRES_IN, algorithm: 'HS256'} )
         const result = await sendEmailLink({send_to: user.email, token: token, type: "new-device", username: user?.full_name})
         if(result == true) {
           return res.json({message: "We have sent you a confirmation link to your email address"})
         } else {
           return res.json({message: "Error in the email server, check back again soon"})
         }
      }

      if(!user?.confirmed) {
        const token = jwt.sign({id: user.id, device: device??null}, config.secrets.accessToken, { expiresIn: process.env.EMAIL_TOKEN_EXPIRES_IN, algorithm: 'HS256'} )
        await sendEmailLink({send_to: user.email, token: token, type: "verify-email", username: user?.full_name})
        return res.json({message: "We have sent you a confirmation link to your email address"})
      }
*/

      const permissions = await effectivePermissions(user)
      var fullUrl = user?.url?.filepath ? req.protocol + '://' + req.get('host')+user?.url?.filepath : null;
      const updatedUser =  {
        id: user.id,
        full_name: user.full_name,
        ...legacyNameParts(user.full_name),
        email: user.email,
        username: user.username,
        phone: user.phone,
        active: user.active,
        blocked: user.blocked,
        confirmed: user.confirmed,
        role: user.roles?.role,
        role_id: user.role_id,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        about_me: user.about_me,
        permissions: permissions,
        img_url: fullUrl
      }

      // every sign-in is its own session: other devices stay signed in
      const { session, token: refreshToken } = await sessions.createSession(user.id, { userAgent: req.headers['user-agent'] })
      const userData = {
        id: updatedUser.id,
        role: updatedUser.role,
        permissions: updatedUser.permissions,
        sid: session.id,
      }
      const accessToken = generateAccessToken(userData)
      sessions.setRefreshCookie(res, refreshToken)

      return res.json({ 
        user: updatedUser,
        accessToken: accessToken,
        rt: refreshToken,
        message: "Successfully Logged In!"
      });
      
    } catch (e) {
      console.error('Login failed:', e?.message);
      res.status(500).json({ error: true, message: "Something went wrong" });
    }
})

function generateAccessToken(user) {
    return jwt.sign(user, config.secrets.accessToken, { expiresIn: config.tokens.accessExpiresIn, algorithm: 'HS256'} )
}

function convertToMilliseconds(timeString) {
  const unit = timeString.slice(-1);
  const value = parseInt(timeString.slice(0, -1));
  switch (unit) {
      case 's':
          return value * 1000; 
      case 'm':
          return value * 60 * 1000; 
      case 'h':
          return value * 60 * 60 * 1000; 
      case 'd':
          return value * 24 * 60 * 60 * 1000;
      default:
          throw new Error('Invalid time unit specified');
  }
}


route.post("/verify_email", async(req, res)=> {
  const {token} = req.body
  if(!token) return res.json({error: true, message: "Email Not Verified!"})
  try {
    const decodedToken = jwt.verify(token, config.secrets.accessToken, { algorithms: ['HS256'] },)
    const user = await User.findOne({where: {id: decodedToken.id}})
    if(user) {
      user.confirmed = 1;
      await user.save();
      if(decodedToken?.device) {
        await user.createDevice({
           device: decodedToken.device,
        })
      }
      return res.json({message: "Email Verified Successfully"})
    }
    res.send({error: true, message: "Token Expired, Try Again Later!"})
  } catch(e) {
    res.sendStatus(401)
  }
})

route.post("/verify_new_device", async(req, res)=> {
  // Only the single-purpose link produced by POST /device/replace/request is accepted (see services/devices.js).
  // An ordinary access token no longer works here, and the link cannot be replayed after the registration changed.
  const {token} = req.body
  if(!token || typeof token !== 'string') return res.status(400).json({error: true, message: "Device Not Verified!"})
  try {
    await devices.redeemReplacementToken(token)
    return res.json({message: "Device Verified Successfully"})
  } catch(e) {
    return res.status(e?.publicMessage ? 400 : 500).json({error: true, message: e?.publicMessage || "Something went wrong"})
  }
})

route.post('/reset_password', loginLimiter, async (req, res) => {
  // The answer is identical whether or not the address is registered, so this cannot be used to discover accounts.
  const generic = {message: "If this email is registered, we have sent a reset link to it."}
  try {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim() : ''
      if(!email) return res.json(generic)
      const user = await User.findOne({where: {email}})
      if(user && user.active !== false) {
        const token = jwt.sign({id: user.id, typ: 'reset'}, config.secrets.accessToken, { expiresIn: process.env.EMAIL_TOKEN_EXPIRES_IN, algorithm: 'HS256'} )
        user.reset_password_token = token
        await user.save()
        const result = await sendEmailLink({send_to: user?.email, token: token, type: "reset-password", username: user?.full_name})
        if(result != true) console.error('Password reset e-mail could not be sent')
      }
      return res.json(generic)
  } catch (e) {
    console.error('Password reset request failed:', e?.message);
    return res.json(generic)
  }
})

/* ---------------- password recovery by e-mailed code (mobile app) ----------------
 * The code is 6 digits, valid for 15 minutes, allows 5 guesses, and only its hash is stored (in reset_password_token with
 * an "otp:" prefix, which can never equal a signed reset link token). Changing the password signs out every session. */
const OTP_TTL_MS = 15 * 60 * 1000
const OTP_MAX_GUESSES = 5
const hashCode = (code) => crypto.createHash('sha256').update(`${config.secrets.accessToken}:${code}`).digest('hex')
const readOtp = (stored) => {
  const m = /^otp:([a-f0-9]{64}):(\d+):(\d+)$/.exec(String(stored || ''))
  return m ? { hash: m[1], expires: Number(m[2]), guesses: Number(m[3]) } : null
}
const findByIdentifier = (identifier) => User.findOne({ where: accountWhere(identifier) })

route.post('/forgot/request', forgotRequestLimiter, forgotAccountLimiter, async (req, res) => {
  try {
    const identifier = typeof req.body?.identifier === 'string' ? req.body.identifier.trim() : ''
    if (!identifier || identifier.length > 120) return res.status(400).json({ error: true, code: 'invalid', message: 'Enter your phone number or email.' })
    const user = await findByIdentifier(identifier)
    if (!user || user.active === false) return res.json({ status: 'sent', message: 'If an account matches, a 6-digit code is on its way to the email on file.' })
    if (!hasRealEmail(user.email)) {
      // no address to send to: the app tells the person to contact support instead of promising an email that never arrives
      return res.json({ status: 'no_email', message: 'This account has no email address on file.' })
    }
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0')
    user.reset_password_token = `otp:${hashCode(code)}:${Date.now() + OTP_TTL_MS}:0`
    await user.save()
    const sent = await sendResetCode({ send_to: user.email, code, username: user.full_name })
    if (!sent) {
      console.error('Password reset code e-mail could not be sent')
      return res.status(502).json({ error: true, code: 'email_failed', message: 'We could not send the email right now. Please try again in a few minutes.' })
    }
    return res.json({ status: 'sent', email: maskEmail(user.email), expiresInMinutes: OTP_TTL_MS / 60000, message: 'We sent a 6-digit code to your email.' })
  } catch (e) {
    console.error('Password reset code request failed:', e?.message)
    return res.status(500).json({ error: true, message: 'Something went wrong' })
  }
})

route.post('/forgot/reset', forgotResetLimiter, async (req, res) => {
  try {
    const identifier = typeof req.body?.identifier === 'string' ? req.body.identifier.trim() : ''
    const code = typeof req.body?.code === 'string' ? req.body.code.replace(/\D/g, '') : ''
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : ''
    if (!identifier || code.length !== 6) return res.status(400).json({ error: true, code: 'invalid_code', message: 'Enter the 6-digit code from your email.' })
    if (newPassword.length < 8) return res.status(400).json({ error: true, code: 'weak_password', message: 'Password must be at least 8 characters' })
    const user = await findByIdentifier(identifier)
    const otp = user ? readOtp(user.reset_password_token) : null
    if (!user || user.active === false || !otp) return res.status(400).json({ error: true, code: 'invalid_code', message: 'That code is not valid. Request a new one.' })
    if (otp.expires < Date.now() || otp.guesses >= OTP_MAX_GUESSES) {
      user.reset_password_token = ''
      await user.save()
      return res.status(400).json({ error: true, code: 'expired_code', message: 'That code has expired. Request a new one.' })
    }
    const given = Buffer.from(hashCode(code))
    const wanted = Buffer.from(otp.hash)
    if (!crypto.timingSafeEqual(given, wanted)) {
      // conditional on the value just read, so parallel guesses cannot all be counted against the same stored count
      await User.update({ reset_password_token: `otp:${otp.hash}:${otp.expires}:${otp.guesses + 1}` }, { where: { id: user.id, reset_password_token: user.reset_password_token } })
      return res.status(400).json({ error: true, code: 'invalid_code', attemptsLeft: Math.max(0, OTP_MAX_GUESSES - otp.guesses - 1), message: 'That code is not correct.' })
    }
    // the code is consumed by the same statement that changes the password: only one of two parallel correct submissions wins
    const [consumed] = await User.update(
      { password: bcrypt.hashSync(newPassword, 10), reset_password_token: '', refresh_token: null, password_change_required: false },
      { where: { id: user.id, reset_password_token: user.reset_password_token } }
    )
    if (!consumed) return res.status(400).json({ error: true, code: 'invalid_code', message: 'That code is not valid. Request a new one.' })
    await sessions.revokeAllForUser(user.id, 'password_change')
    return res.json({ message: 'Successfully Updated' })
  } catch (e) {
    console.error('Password reset failed:', e?.message)
    return res.status(500).json({ error: true, message: 'Something went wrong' })
  }
})

const verifyResetToken = (token) => {
  const jData = jwt.verify(
      token,
      config.secrets.accessToken,
      { algorithms: ['HS256'] },
      (err, decoded) => {
          if (err || decoded?.typ !== 'reset') return {status: false}
          return {status: true, decoded: decoded};
      }
  );
  return jData
}

route.post('/set_new_password', loginLimiter, async (req, res) => {
  try {
      const {newPassword, resetToken} = req.body
      if(!resetToken || typeof resetToken !== 'string') return res.json({error: true, message: "Invalid Token"})
      const user = await User.findOne({where: {reset_password_token: resetToken}})
      if(user) {
        const {status, decoded} = verifyResetToken(resetToken)
        if(status && String(decoded?.id) !== String(user.id)) return res.json({error: true, message: "Invalid Token"})
        if(!newPassword) {
          if(status==true) {
            return res.json({error: false, message: "Valid Token"})
          }
          else {
            return res.json({error: true, message: "Token Expired"})
          }
        }
        else {
          if(status==true && newPassword) {
            if(String(newPassword).length < 8) return res.json({error: true, message: "Password must be at least 8 characters"})
            const password = bcrypt.hashSync(newPassword ?? "", 10)
            user.password = password
            user.reset_password_token = ""
            user.refresh_token = null // a password change signs out every existing session
            user.password_change_required = false
            user.confirmed = 1
            await user.save()
            await sessions.revokeAllForUser(user.id, 'password_change')
            if(decoded?.device) {
              await user.createDevice({
                 device: decoded?.device,
              })
            }
            return res.json({message: "Successfully Updated"})
          }
          else {
            return res.json({error: true, message: "Token Expired"})
          }
        }
      }
      else {
        return res.json({error: true, message: "Invalid Token"})
      }
  }
  catch(e) {
    console.error('Setting new password failed:', e?.message);
    return res.status(500).json({error: true, message: "Something went wrong"})
  }
})

const checkUsernameOrPasswordExist = async (req, res, next) => {
  try {
    const { username, email } = req.body;
    const full_name = fullNameFrom(req.body);
    const usernameFound = await User.findAll({
      where: { username: username ?? "" },
    });
    if (usernameFound.length > 0) {
      const { file } = req?.files || {};
      if(file) {
        fs.unlink(file.tempFilePath, (err) => {})
      }
      return res.json({ error: true, message: "Username Already Exist!" });
    }

    const emailFound = await User.findAll({
      where: { email: email ?? "" },
    });
    if (emailFound.length > 0) {
      const { file } = req.files || {};
      if(file) {
        fs.unlink(file.tempFilePath, (err) => {})
      }
      return res.json({ error: true, message: "Email Already Exist!" });
    }

    if (!full_name) {
      const { file } = req.files || {};
      if(file) {
        fs.unlink(file.tempFilePath, (err) => {})
      }
      return res.json({ error: true, message: "Full name is required!" });
    }

    next();
  } catch (err) {
    console.error('Sign-up check failed:', err?.message)
    return res.status(500).json({ error: true, message: "Something went wrong" })
  }
};

route.post(
  "/create_account",
  registerLimiter,
  checkUsernameOrPasswordExist,
  uploadFilesProfile(false),
  async (req, res) => {
    try {
      const {
        username,
        email,
        phone,
        password,
        device,
        role,
        date_of_birth,
        gender,
        about_me,
      } = req.body;
      if (!password || String(password).length < 8) {
        return res.json({ error: true, message: "Password must be at least 8 characters" });
      }
      if (String(password).length > 72) {
        return res.json({ error: true, message: "Password is too long" });
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email))) {
        return res.json({ error: true, message: "Enter a valid email address" });
      }
      const user = await User.create({
        //basic
        full_name: fullNameFrom(req.body).slice(0, 160),
        username: username ?? "",
        email: email ?? "",
        phone: phone ?? "",
        password: bcrypt.hashSync(password ?? "", 10),
        upload_id: req.userUpload ?? null,
        // Public sign-up always creates a student. Choosing "Instructor" only files a request that an administrator
        // must approve (with explicit course assignments); it never grants instructor permissions by itself.
        role_id: 5,
        date_of_birth: date_of_birth,
        gender: gender,
        about_me: about_me??"",

        //other
        active: true,
        confirmed: false,
      });
      await user.createDevice({ device: device ?? "" });
      const wantsInstructor = role == 12
      if (wantsInstructor) {
        await InstructorRequest.create({ user_id: user.id, status: 'pending', message: 'Requested at sign-up' })
      }
      for (const permissionId of [12, 15]) {
        await UserPermission.upsert({
          user_id: user.id,
          permission_id: permissionId,
          added_by: user.id
        })
      }
      // `message` is matched literally by the existing web and mobile sign-up screens: keep it unchanged
      return res.status(200).send({
        message: "Successfully Registered",
        instructor_request: wantsInstructor ? "pending" : undefined,
        note: wantsInstructor ? "Your instructor request is waiting for administrator approval. Until then you have a student account." : undefined,
      });
    } catch (e) {
      console.error('Registration failed:', e?.message)
      if(e?.errors?.length > 0 && e?.errors[0]?.message) {
        return res.json({ error: true, message: e?.errors[0]?.message })
      }
      return res.json({error: true, message: "Something went wrong"})
    }
  }
);

module.exports = route
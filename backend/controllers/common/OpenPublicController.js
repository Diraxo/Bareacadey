const express = require('express')
const rateLimit = require('express-rate-limit')
const route = express.Router()
const { settlePayment } = require('../../services/chapa')

// The callback is public by nature (Chapa calls it). It is only a trigger: access is granted solely when
// Chapa's verify API confirms the payment we stored (see services/chapa.js).
const callbackLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false })

const respondToVerification = async (req, res) => {
  try {
    const result = await settlePayment(req.params.id)
    if (result.status === 'invalid_reference') return res.status(400).json({ error: true, message: "Invalid payment reference" })
    if (result.status === 'paid' || result.status === 'already_paid') return res.json({ message: "Payment Successful" })
    return res.json({ message: "Payment Was Not Successful" })
  } catch (e) {
    console.error("Payment can't be verified:", e?.message)
    return res.status(500).json({ error: true, message: "Payment could not be verified" })
  }
}

route.get("/verify-payment/:id", callbackLimiter, respondToVerification)

module.exports = route
module.exports.respondToVerification = respondToVerification
module.exports.callbackLimiter = callbackLimiter

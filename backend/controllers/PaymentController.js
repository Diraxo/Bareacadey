/*** import common staffs ***/
const express = require('express')
const route = express.Router()
const Sequelize = require('sequelize')
const Payment = require('../models/Payment')
const User = require('../models/User.js')
const verifyRoles = require("../middlewares/verifyRoles")
let Roles = require("../roles")

const Course = require('../models/Course')
const Chapter = require('../models/Chapter')
const Config = require('../models/Config.js')
const config = require('../config')
const chapa = require('../services/chapa')
const { coursePrice } = require('../services/pricing')
const { coursesAreFree } = require('../services/freeCourses')
const { legacyNameParts } = require('../services/fullName')

const CURRENCIES = ["ETB", "USD"]

const usdRate = async () => {
  const row = await Config.findOne({ where: { id: 4 } })
  const rate = Number(JSON.parse(row?.config || '{}')?.usdToBirr)
  return Number.isFinite(rate) && rate > 0 ? rate : null
}

route.post("/", verifyRoles(Roles?.payment_createRoles), async (req, res) => {
  try {
    const { _currency, _course_id, _chapter_id, _phone_number } = req.body

    const currency = _currency || "ETB"
    if (!CURRENCIES.includes(currency)) return res.status(400).json({ error: true, message: "Currency must be one of 'ETB' or 'USD'" })
    if (!_course_id && !_chapter_id) return res.status(400).json({ error: true, message: "Select all fields first!" })

    let amount = 0
    let title = "Course Payment"
    let description = ""

    if (_course_id) {
      const course = await Course.findOne({ where: { id: _course_id } })
      if (!course) return res.status(404).json({ error: true, message: "Course not found" })
      amount = coursesAreFree() ? 0 : coursePrice(course)
      description = course.title
    } else {
      const chapter = await Chapter.findOne({ where: { id: _chapter_id } })
      if (!chapter) return res.status(404).json({ error: true, message: "Chapter not found" })
      amount = coursesAreFree() ? 0 : chapter.price || 0
      title = "Chapter Payment"
      description = chapter.title
    }

    if (!(amount > 0)) return res.status(400).json({ error: true, message: "This item is free" })

    if (currency === "USD") {
      const rate = await usdRate()
      if (!rate) return res.status(500).json({ error: true, message: "Exchange rate is not configured" })
      amount = Math.max(amount / rate, 1)
    }
    amount = Number(Number(amount).toFixed(2))

    const user = await User.findOne({ where: { id: req.user.id } })
    if (!user) return res.status(401).json({ error: true, message: "You are not authorized!" })

    const alreadyPaid = await Payment.findOne({
      where: { user_id: user.id, paid: true, ...(_course_id ? { course_id: _course_id } : { chapter_id: _chapter_id }) },
    })
    if (alreadyPaid) return res.status(409).json({ error: true, message: "You have already purchased this item" })

    const TEXT_REF = "tx_ja_" + (_course_id ? "course" : "chapter") + "_" + Date.now() + "-" + user.id + "." + (_course_id ? _course_id : _chapter_id)
    const data = {
      amount: amount,
      currency: currency,
      email: user.email,
      ...legacyNameParts(user.full_name),
      tx_ref: TEXT_REF,
      callback_url: config.urls.api + "/api/open_public/verify-payment/" + TEXT_REF,
      title: title,
      description: description,
    }

    const responseData = await chapa.initializeTransaction(data)
    if (responseData?.status !== 'success') {
      return res.status(502).json({ error: true, message: "The payment provider could not start this payment" })
    }

    await Payment.create({
      amount: amount,
      currency: currency,
      user_id: user.id,
      course_id: _course_id ? _course_id : null,
      chapter_id: _chapter_id ? _chapter_id : null,
      phone_number: _phone_number,
      added_by: user.id,
      updated_by: user.id,
      paid: false,
      reference_no: TEXT_REF,
    })
    return res.json(responseData)
  } catch (e) {
    console.error("Payment initialisation failed:", e?.message)
    return res.status(500).json({ error: true, message: "Something went wrong" })
  }
})

route.post("/check_payment", async (req, res) => {
  try {
    const { course_id, chapter_id } = req.body
    if (!course_id && !chapter_id) return res.status(400).json({ error: true, message: "Select all fields first!" })

    const target = {}
    if (course_id) target.course_id = course_id
    if (chapter_id) target.chapter_id = chapter_id

    const paid = await Payment.findOne({ where: { user_id: req.user.id, paid: true, ...target } })
    if (paid) return res.json({ message: "Payment Was Successful" })

    // The provider callback may not have reached us (or may still be in flight): re-verify the user's open attempts.
    const pending = await Payment.findAll({ where: { user_id: req.user.id, paid: false, ...target }, order: [['id', 'DESC']], limit: 3 })
    for (const attempt of pending) {
      const result = await chapa.settlePayment(attempt.reference_no)
      if (result.status === 'paid' || result.status === 'already_paid') return res.json({ message: "Payment Was Successful" })
    }
    return res.json({ error: true, message: "Not paid yet" })
  } catch (error) {
    console.error("check_payment failed:", error?.message)
    return res.status(500).json({ error: true, message: "Something went wrong" })
  }
})

module.exports = route

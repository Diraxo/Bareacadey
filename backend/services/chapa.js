/* Chapa integration.
 *
 * A payment is only ever marked paid by `settlePayment`, which asks Chapa's verify API about the
 * transaction and then compares status, tx_ref, currency and amount with the Payment row that WE
 * created at initialisation. Nothing from the (public) callback request is trusted except the tx_ref
 * used as a lookup key. */
const axios = require('axios')
const Sequelize = require('sequelize')
const config = require('../config')
const Payment = require('../models/Payment')

// tx_ja_<course|chapter>_<epoch>-<userId>.<targetId>
const TX_REF_PATTERN = /^tx_ja_(course|chapter)_\d{10,16}-\d+\.\d+$/
const isValidTxRef = (ref) => typeof ref === 'string' && ref.length <= 100 && TX_REF_PATTERN.test(ref)

const authHeaders = () => ({ Authorization: `Bearer ${config.chapa.secretKey}` })

const initializeTransaction = async (data) => {
  const response = await axios.post(config.chapa.initializeUrl, data, {
    headers: authHeaders(),
    timeout: 20000,
    validateStatus: () => true,
  })
  return response.data
}

const fetchVerification = async (txRef) => {
  const response = await axios.get(config.chapa.verifyUrl + encodeURIComponent(txRef), {
    headers: authHeaders(),
    timeout: 20000,
    validateStatus: () => true,
  })
  return response.data
}

/* Pure comparison of a Chapa verify response against our stored payment. Returns { ok, reason }. */
const evaluateVerification = (payment, body) => {
  if (!body || body.status !== 'success' || !body.data) return { ok: false, reason: 'verification_failed' }
  const data = body.data
  if (String(data.status).toLowerCase() !== 'success') return { ok: false, reason: 'not_successful' }
  if (String(data.tx_ref) !== String(payment.reference_no)) return { ok: false, reason: 'reference_mismatch' }
  if (String(data.currency).toUpperCase() !== String(payment.currency).toUpperCase()) return { ok: false, reason: 'currency_mismatch' }
  const paidAmount = Number(data.amount)
  const expected = Number(payment.amount)
  if (!Number.isFinite(paidAmount) || !Number.isFinite(expected) || Math.abs(paidAmount - expected) > 0.009) {
    return { ok: false, reason: 'amount_mismatch' }
  }
  return { ok: true }
}

/* tx_ref embeds ids for human debugging; they must agree with the stored row. */
const refMatchesPayment = (payment) => {
  const m = /^tx_ja_(course|chapter)_\d+-(\d+)\.(\d+)$/.exec(payment.reference_no || '')
  if (!m) return false
  const [, kind, userId, targetId] = m
  if (String(payment.user_id) !== userId) return false
  return kind === 'course' ? String(payment.course_id) === targetId : String(payment.chapter_id) === targetId
}

/* Verifies with Chapa and grants access. Idempotent: an already-paid row is returned as such. */
const settlePayment = async (txRef, { fetcher = fetchVerification } = {}) => {
  if (!isValidTxRef(txRef)) return { status: 'invalid_reference' }

  const payment = await Payment.findOne({ where: { reference_no: txRef } })
  if (!payment) return { status: 'not_found' }
  if (payment.paid) return { status: 'already_paid', payment }
  if (!refMatchesPayment(payment)) return { status: 'rejected', reason: 'reference_inconsistent' }

  let body
  try {
    body = await fetcher(txRef)
  } catch (e) {
    return { status: 'unavailable' }
  }

  const verdict = evaluateVerification(payment, body)
  if (!verdict.ok) {
    return { status: verdict.reason === 'not_successful' ? 'pending' : 'rejected', reason: verdict.reason }
  }

  payment.paid = true
  payment.updated_by = payment.user_id
  await payment.save()

  // drop the user's other unpaid attempts for the same item (existing behaviour)
  const targetWhere = payment.course_id ? { course_id: payment.course_id } : { chapter_id: payment.chapter_id }
  await Payment.destroy({
    where: { id: { [Sequelize.Op.ne]: payment.id }, user_id: payment.user_id, paid: false, ...targetWhere },
  })
  return { status: 'paid', payment }
}

module.exports = {
  isValidTxRef,
  initializeTransaction,
  fetchVerification,
  evaluateVerification,
  settlePayment,
}

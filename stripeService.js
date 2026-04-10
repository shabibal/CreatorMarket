// Stripe Service - Node.js backend
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

// إنشاء حساب متصل (محفظة)
async function createConnectedAccount(email) {
  return await stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {transfers: {requested: true}, card_payments: {requested: true}}
  })
}

// استقبال دفعة
async function createPaymentIntent(amount, currency = 'usd', connectedAccountId) {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    payment_method_types: ['card'],
    transfer_data: connectedAccountId ? { destination: connectedAccountId } : undefined
  })
}

// سحب تلقائي
async function createPayout(connectedAccountId, amount, currency = 'usd') {
  return await stripe.payouts.create({
    amount: Math.round(amount * 100),
    currency
  }, {stripeAccount: connectedAccountId})
}

// رابط تفعيل الحساب
async function getAccountLink(accountId, refreshUrl, returnUrl) {
  return await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding'
  })
}

module.exports = {
  createConnectedAccount,
  createPaymentIntent,
  createPayout,
  getAccountLink
}

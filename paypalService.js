// PayPal Service - Node.js backend
const fetch = require('node-fetch')

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const PAYPAL_SECRET = process.env.PAYPAL_SECRET
const PAYPAL_API = 'https://api-m.sandbox.paypal.com' // استخدم production في البيئة الحقيقية

async function getAccessToken() {
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(PAYPAL_CLIENT_ID + ':' + PAYPAL_SECRET).toString('base64')
    },
    body: 'grant_type=client_credentials'
  })
  const data = await response.json()
  return data.access_token
}

// إنشاء اشتراك
async function createSubscription(planId) {
  const token = await getAccessToken()
  const response = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({plan_id: planId})
  })
  return await response.json()
}

module.exports = {
  createSubscription
}

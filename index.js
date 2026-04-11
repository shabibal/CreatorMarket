const express = require('express')
const cors = require('cors')
require('dotenv').config()

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const fetch = require('node-fetch')

const app = express()

app.use(cors())
app.use(express.json())

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const PAYPAL_SECRET = process.env.PAYPAL_SECRET
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox'
const PAYPAL_API = PAYPAL_MODE === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'
const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || '10')
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

let paypalAccessToken = null
let paypalTokenExpiry = null

async function getPayPalAccessToken() {
  if (paypalAccessToken && paypalTokenExpiry && Date.now() < paypalTokenExpiry) {
    return paypalAccessToken
  }
  
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(PAYPAL_CLIENT_ID + ':' + PAYPAL_SECRET).toString('base64')
    },
    body: 'grant_type=client_credentials'
  })
  
  const data = await response.json()
  paypalAccessToken = data.access_token
  paypalTokenExpiry = Date.now() + (data.expires_in * 1000) - 60000
  return paypalAccessToken
}

// ============================================
// PAYPAL SUBSCRIPTIONS API (Basic $8, Premium $15)
// ============================================

const SUBSCRIPTION_PLANS = {
  basic: 'PLAN-BASIC-MONTHLY',
  premium: 'PLAN-PREMIUM-MONTHLY'
}

app.post('/api/create-paypal-subscription', async (req, res) => {
  try {
    const { planId, userId } = req.body
    
    const token = await getPayPalAccessToken()
    
    const response = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        plan_id: planId,
        subscriber: { notification_channel: 'email' },
        application_context: {
          brand_name: 'CreatorMarket',
          landing_page: 'NO_PREFERENCE',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${FRONTEND_URL}/subscriptions/success`,
          cancel_url: `${FRONTEND_URL}/subscriptions/cancel`
        }
      })
    })
    
    const data = await response.json()
    
    if (data.links) {
      const approvalLink = data.links.find(link => link.rel === 'approve')
      return res.json({ 
        success: true, 
        subscriptionId: data.id,
        approvalUrl: approvalLink?.href 
      })
    }
    
    res.json({ success: false, error: data })
  } catch (error) {
    console.error('PayPal subscription error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/paypal-webhook', express.json(), async (req, res) => {
  try {
    const event = req.body
    
    const paypalTransmissionId = req.headers['paypal-transmission-id']
    const paypalTimestamp = req.headers['paypal-transmission-time']
    const paypalSignature = req.headers['paypal-signature']
    const paypalCertUrl = req.headers['paypal-cert-url']
    
    console.log('PayPal webhook received:', event.event_type)
    console.log('  Transmission ID:', paypalTransmissionId)
    console.log('  Timestamp:', paypalTimestamp)
    
    const allowedEvents = [
      'PAYMENT.SCAPTURE.COMPLETED',
      'SUBSCRIPTION.ACTIVATED',
      'SUBSCRIPTION.CANCELLED',
      'SUBSCRIPTION.EXPIRED',
      'SUBSCRIPTION.PAYMENT.FAILED',
      'BILLING.SUBSCRIPTION.REACTIVATED'
    ]
    
    if (!allowedEvents.includes(event.event_type)) {
      console.log('Unknown event type:', event.event_type)
      return res.json({ received: true, status: 'ignored' })
    }
    
    switch (event.event_type) {
      case 'PAYMENT.SCAPTURE.COMPLETED':
      case 'SUBSCRIPTION.ACTIVATED': {
        const subscriptionId = event.resource?.id || event.resource?.supplementary_data?.related_ids?.subscription_id
        console.log('Subscription activated:', subscriptionId)
        break
      }
      case 'SUBSCRIPTION.CANCELLED': {
        const subscriptionId = event.resource?.id
        console.log('Subscription cancelled:', subscriptionId)
        break
      }
      case 'SUBSCRIPTION.EXPIRED': {
        const subscriptionId = event.resource?.id
        console.log('Subscription expired:', subscriptionId)
        break
      }
      case 'SUBSCRIPTION.PAYMENT.FAILED': {
        const subscriptionId = event.resource?.id
        console.log('Subscription payment failed:', subscriptionId)
        break
      }
    }
    
    res.json({ received: true })
  } catch (error) {
    console.error('PayPal webhook error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/paypal-subscription/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params
    const token = await getPayPalAccessToken()
    
    const response = await fetch(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    res.json(await response.json())
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// STRIPE CONNECT API (Marketplace Payments)
// ============================================

app.post('/api/create-stripe-account', async (req, res) => {
  try {
    const { email, userId } = req.body
    
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      metadata: { userId },
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true }
      },
      business_type: 'individual'
    })
    
    res.json({ success: true, accountId: account.id })
  } catch (error) {
    console.error('Stripe account creation error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/create-stripe-account-link', async (req, res) => {
  try {
    const { accountId, userId } = req.body
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${FRONTEND_URL}/vendor/stripe/refresh`,
      return_url: `${FRONTEND_URL}/vendor/stripe/return`,
      type: 'account_onboarding'
    })
    
    res.json({ success: true, url: accountLink.url })
  } catch (error) {
    console.error('Stripe account link error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/vendor-account-status/:userId', async (req, res) => {
  try {
    const stripeAccountId = req.headers['stripe-account-id']
    
    if (!stripeAccountId) {
      return res.json({ 
        connected: false,
        detailsSubmitted: false,
        chargesEnabled: false,
        payoutsEnabled: false
      })
    }
    
    const account = await stripe.accounts.retrieve(stripeAccountId)
    
    res.json({
      connected: true,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      requirements: account.requirements
    })
  } catch (error) {
    console.error('Get account status error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// STRIPE CHECKOUT - All Payment Methods
// ============================================

app.post('/api/create-stripe-checkout-session', async (req, res) => {
  try {
    const { 
      amount, 
      currency = 'usd',
      vendorStripeAccountId,
      productId,
      productName,
      buyerId,
      metadata = {}
    } = req.body
    
    const platformFee = amount * (PLATFORM_FEE_PERCENT / 100)
    
    const sessionParams = {
      payment_method_types: [
        'card',
        'apple_pay',
        'google_pay'
      ],
      line_items: [{
        price_data: {
          currency,
          product_data: {
            name: productName || 'Product/Service',
            metadata: { productId }
          },
          unit_amount: Math.round(amount * 100)
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/payment/cancel`,
      metadata: { buyerId, productId, ...metadata }
    }
    
    if (vendorStripeAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: Math.round(platformFee * 100),
        transfer_data: {
          destination: vendorStripeAccountId
        }
      }
    }
    
    const session = await stripe.checkout.sessions.create(sessionParams)
    
    res.json({ 
      success: true, 
      sessionId: session.id,
      url: session.url,
      platformFee,
      netAmount: amount - platformFee
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ============================================
// STRIPE WEBHOOK
// ============================================

app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return res.status(500).json({ error: 'Webhook secret not configured' })
  }
  
  let event
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }
  
  console.log('Stripe webhook received:', event.type)
  
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      console.log('Payment completed:', session.id)
      console.log('  Amount:', session.amount_total / 100)
      console.log('  Customer:', session.customer_email)
      console.log('  Metadata:', JSON.stringify(session.metadata))
      
      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent)
      
      if (paymentIntent.transfer_data?.destination) {
        console.log('  Transfer to vendor:', paymentIntent.transfer_data.destination)
        console.log('  Platform fee:', paymentIntent.application_fee_amount / 100)
      }
      break
    }
    case 'payment_intent.succeeded':
      console.log('Payment succeeded:', event.data.object.id)
      break
    case 'payment_intent.payment_failed':
      console.log('Payment failed:', event.data.object.id)
      break
    case 'account.updated': {
      const account = event.data.object
      console.log('Connected account updated:', account.id)
      console.log('  Details submitted:', account.details_submitted)
      console.log('  Charges enabled:', account.charges_enabled)
      console.log('  Payouts enabled:', account.payouts_enabled)
      break
    }
    case 'payout.paid':
      console.log('Payout completed:', event.data.object.id)
      break
    case 'payout.failed':
      console.log('Payout failed:', event.data.object.id)
      break
  }
  
  res.json({ received: true })
})

// ============================================
// VENDOR BALANCE & PAYOUTS
// ============================================

app.get('/api/get-vendor-balance', async (req, res) => {
  try {
    const stripeAccountId = req.headers['stripe-account-id']
    
    if (!stripeAccountId) {
      return res.status(400).json({ error: 'No Stripe account ID provided' })
    }
    
    const balance = await stripe.balance.retrieve({ stripeAccount: stripeAccountId })
    
    const available = balance.available.reduce((sum, b) => sum + b.amount, 0) / 100
    const pending = balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100
    
    res.json({ available, pending, currency: balance.available[0]?.currency || 'usd' })
  } catch (error) {
    console.error('Get balance error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/request-payout', async (req, res) => {
  try {
    const { amount, stripeAccountId, userId, currency = 'usd' } = req.body
    
    if (!stripeAccountId) {
      return res.status(400).json({ error: 'No Stripe account connected' })
    }
    
    const payout = await stripe.payouts.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: { userId }
    }, { stripeAccount: stripeAccountId })
    
    res.json({
      success: true,
      payoutId: payout.id,
      status: payout.status,
      amount: payout.amount / 100
    })
  } catch (error) {
    console.error('Payout error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/payout-history', async (req, res) => {
  try {
    const stripeAccountId = req.headers['stripe-account-id']
    
    if (!stripeAccountId) {
      return res.status(400).json({ error: 'No Stripe account ID provided' })
    }
    
    const payouts = await stripe.payouts.list({ limit: 20 }, { stripeAccount: stripeAccountId })
    
    res.json({
      payouts: payouts.data.map(p => ({
        id: p.id,
        amount: p.amount / 100,
        currency: p.currency,
        status: p.status,
        created: p.created,
        arrivalDate: p.arrival_date
      }))
    })
  } catch (error) {
    console.error('Get payout history error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// VERIFY STRIPE SESSION
// ============================================

app.get('/api/verify-stripe-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    res.json({
      success: session.payment_status === 'paid',
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total / 100,
      currency: session.currency,
      metadata: session.metadata
    })
  } catch (error) {
    console.error('Verify session error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// HEALTH CHECK
// ============================================

apayment_method_types: [
  'card',
  'paypal'   // paypal مدعوم!
],

const PORT = process.env.PORT || 10000

app.listen(PORT, () => {
  console.log(`\n🎯 CreatorMarket Payment Server Running on Port ${PORT}`)
  console.log('=============================================')
  console.log('✅ PayPal: Subscriptions (Basic $8, Premium $15)')
  console.log('✅ Stripe: Card, Apple Pay, Google Pay')
  console.log('✅ Platform Fee: 10%')
  console.log('✅ Vendor Payouts: Automatic via Stripe Connect')
  console.log('=============================================\n')
})

module.exports = app

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Erro ao verificar webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Lida com os tipos de evento
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const stripeSubId = subscription.id;

    // Aqui você pode buscar o usuário pelo stripeSubscriptionId e atualizar no banco:
    const user = await User.findOne({ where: { stripeSubscriptionId: stripeSubId } });


      user.stripeSubscriptionId = null;
      await user.save();

    console.log('Assinatura cancelada pelo webhook.');
  }

  res.status(200).send('Evento recebido');
});


module.exports = router;

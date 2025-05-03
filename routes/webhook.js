const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');
const bodyParser = require('body-parser');
const sendConfirmationEmail = require('../Services/Emailsend')

router.post(
  '/',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('⚠️ Erro na verificação do webhook:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      const customerEmail = session.customer_email;
      const priceId = session.metadata?.priceId;

      if (!customerEmail || !priceId) {
        return res.status(400).send('Dados do cliente ou preço não encontrados');
      }

      try {
        const user = await User.findOne({ where: { email: customerEmail } });

        if (!user) {
          return res.status(404).send('Usuário não encontrado');
        }

        const now = new Date();
        let newExpiration = new Date(now);

        if (priceId === process.env.STRIPE_PRICEID_MONTHLY) {
          newExpiration.setDate(now.getDate() + 30);
        } else if (priceId === process.env.STRIPE_PRICEID_ANNUAL) {
          newExpiration.setDate(now.getDate() + 365);
        } else {
          return res.status(400).send('Plano não reconhecido');
        }

        await user.update({
          isVip: true,
          vipExpirationDate: newExpiration,
          stripeSubscriptionId: session.subscription || null,
        });

        console.log(`✅ VIP atualizado para ${user.email} até ${newExpiration}`);
        await sendConfirmationEmail(email);

        return res.status(200).send({ received: true });
      } catch (err) {
        console.error('Erro ao atualizar usuário:', err);
        return res.status(500).send('Erro ao atualizar usuário');
      }
    }

    res.status(200).send({ received: true });
  }
);

module.exports = router;

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');
const bodyParser = require('body-parser');
const sendConfirmationEmail = require('../Services/Emailsend')

router.post(
  '/',
  express.raw({ type: 'application/json' }),
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

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerEmail = session.customer_email;
        const priceId = session.metadata?.priceId;

        if (!customerEmail || !priceId) {
          return res.status(400).send('Dados do cliente ou preço não encontrados');
        }

        try {
          const user = await User.findOne({ where: { email: customerEmail } });
          if (!user) return res.status(404).send('Usuário não encontrado');

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

          await sendConfirmationEmail(customerEmail);
        } catch (err) {
          console.error('Erro ao atualizar usuário:', err);
          return res.status(500).send('Erro ao atualizar usuário');
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;

        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0].price.id;

          // Encontra o usuário pelo subscriptionId
          const user = await User.findOne({ where: { stripeSubscriptionId: subscriptionId } });
          if (!user) {
            console.error('Usuário com assinatura não encontrado');
            break;
          }

          const now = new Date();
          let newExpiration = new Date(now);

          if (priceId === process.env.STRIPE_PRICEID_MONTHLY) {
            newExpiration.setDate(now.getDate() + 30);
          } else if (priceId === process.env.STRIPE_PRICEID_ANNUAL) {
            newExpiration.setDate(now.getDate() + 365);
          } else {
            console.error('Plano não reconhecido para invoice.paid');
            break;
          }

          await user.update({
            isVip: true,
            vipExpirationDate: newExpiration,
          });

          console.log(`✅ VIP atualizado após pagamento de invoice para: ${user.email}`);
        } catch (err) {
          console.error('Erro ao processar invoice.paid:', err);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const stripeSubId = subscription.id;

        try {
          const user = await User.findOne({ where: { stripeSubscriptionId: stripeSubId } });
          if (user) {
            await user.update({
              stripeSubscriptionId: 'Cancelled',
            });
            console.log('❌ Assinatura cancelada, VIP removido do usuário:', user.email);
          }
        } catch (err) {
          console.error('Erro ao processar cancelamento:', err);
        }
        break;
      }

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    res.status(200).send({ received: true });
  }
);



module.exports = router;

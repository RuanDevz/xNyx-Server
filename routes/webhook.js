const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');
const authMiddleware = require('../Middleware/Auth'); // Certifique-se de importar corretamente

router.post('/', authMiddleware, async (req, res) => {
  const email = req.user.email;
  const { plan } = req.body; // Espera-se que venha 'monthly' ou 'annual'

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(403).json({ error: 'Este e-mail não está autorizado para pagamento.' });
    }

    const prices = {
      monthly: process.env.STRIPE_PRICEID_MONTHLY,
      annual: process.env.STRIPE_PRICEID_ANNUAL,
    };

    if (!prices[plan]) {
      return res.status(400).json({ error: 'Plano inválido selecionado.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: prices[plan],
          quantity: 1,
        },
      ],
      mode: 'subscription', // como está usando `price` que deve estar vinculado a um produto com recorrência
      success_url: `${process.env.FRONTEND_URL}/#/success`,
      cancel_url: `${process.env.FRONTEND_URL}/#/cancel`,
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error.message, error.stack);
    res.status(500).json({ error: 'Erro ao criar sessão de checkout' });
  }
});

module.exports = router;

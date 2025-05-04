const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');
const authenticate = require('../Middleware/Auth'); // se você tiver auth

router.post('/', authenticate, async (req, res) => {
  try {
    const user = req.user; 

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ error: 'Nenhuma assinatura ativa encontrada.' });
    }

    await stripe.subscriptions.del(user.stripeSubscriptionId);

    return res.status(200).json({ message: 'Assinatura cancelada com sucesso.' });
  } catch (err) {
    console.error('Erro ao cancelar assinatura:', err);
    return res.status(500).json({ error: 'Erro ao cancelar assinatura.' });
  }
});

module.exports = router;

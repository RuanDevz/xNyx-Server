const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');

const router = express.Router();

router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.log(`⚠️  Erro na verificação do webhook: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Lógica do webhook aqui
    switch (event.type) {
        case 'invoice.payment_succeeded':
            const invoice = event.data.object;
            const customerEmail = invoice.customer_email;

            const user = await User.findOne({ where: { email: customerEmail } });

            if (user) {
                let newExpirationDate;

                if (user.isVip && user.vipExpirationDate) {
                    newExpirationDate = new Date(user.vipExpirationDate);
                    newExpirationDate.setDate(newExpirationDate.getDate() + 30);
                } else {
                    newExpirationDate = new Date();
                    newExpirationDate.setDate(newExpirationDate.getDate() + 30);
                }

                await user.update({
                    isVip: true,
                    vipExpirationDate: newExpirationDate,
                });
            }
            break;

        case 'customer.subscription.deleted':
            const subscription = event.data.object;
            const customerEmailCancel = subscription.customer_email;

            const userToCancel = await User.findOne({ where: { email: customerEmailCancel } });

            if (userToCancel) {
                await userToCancel.update({
                    isVip: false,
                    vipExpirationDate: null, // Remove a data de expiração
                });
            }
            break;

        default:
            console.log(`Evento não tratado: ${event.type}`);
    }

    res.json({ received: true });
});

module.exports = router;
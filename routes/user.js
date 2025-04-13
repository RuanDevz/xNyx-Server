const express = require('express');
const router = express.Router();
const { User } = require('../models');
const bcrypt = require('bcrypt');
const { sign } = require('jsonwebtoken');
const Authmiddleware = require('../Middleware/Auth');
const isAdmin = require('../Middleware/isAdmin'); // Importando o middleware de admin
const dotenv = require('dotenv');
const { Op } = require("sequelize"); // Importe o Op

dotenv.config();

// Rota para buscar todos os usuários (apenas admins podem acessar)
router.get('/', Authmiddleware, isAdmin, async (req, res) => {
    try {
        const getallusers = await User.findAll();
        res.status(200).json(getallusers);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar usuários." });
    }
});

router.post('/cancel-subscription', async (req, res) => {
    const { userId } = req.body;
  
    try {
      const user = await User.findByPk(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Verifica se o usuário tem uma assinatura associada
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: 'No subscription found to cancel.' });
      }
  
      // Cancela a assinatura no Stripe
      const subscription = await stripe.subscriptions.del(user.stripeSubscriptionId);
  
      // Remove o stripeSubscriptionId do banco de dados para evitar cobranças futuras
      await user.update({
        isVip: false,
        stripeSubscriptionId: null,
      });
  
      res.status(200).json({
        message: 'Subscription canceled successfully. You will retain VIP access until the end of the current billing period.',
        vipExpirationDate: user.vipExpirationDate,
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

router.get('/status', Authmiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado!' });
        }

        const status = {
            isAdmin: user.isAdmin,
            isVip: user.isVip
        };

        res.status(200).json(status);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao verificar status do usuário" });
    }
});
  
  

router.put('/disable-user/:email', Authmiddleware, isAdmin, async (req, res) => {
    const { email } = req.params;
  
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado!" });
      }
  
      // Atualiza o usuário definindo isVip como false e isDisabled como true
      await user.update({ isVip: false, isDisabled: true });
  
      res.status(200).json({ message: "VIP desativado com sucesso!" });
    } catch (error) {
      console.error("Erro ao desabilitar VIP:", error);
      res.status(500).json({ error: "Erro ao desabilitar o VIP." });
    }
  });

  router.get('/vip-disabled-users', Authmiddleware, isAdmin, async (req, res) => {
    try {
      const vipDisabledUsers = await User.findAll({
        where: { isDisabled: true },  // Alterado para isDisabled
        attributes: ['id', 'name', 'email', 'vipExpirationDate', 'isDisabled']  // Alterado para isDisabled
      });
  
      // Formata a data de expiração para string, se existir.
      const formattedUsers = vipDisabledUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        vipExpirationDate: user.vipExpirationDate 
          ? user.vipExpirationDate.toISOString() 
          : "Não definida",
        isDisabled: user.isDisabled  // Usando o campo isDisabled
      }));
  
      res.status(200).json(formattedUsers);
    } catch (error) {
      console.error("Erro ao buscar usuários VIP desabilitados:", error);
      res.status(500).json({ error: "Erro ao buscar usuários VIP desabilitados." });
    }
  });
  
  

router.get('/is-admin/:email', async (req, res) => {
    const { email } = req.params;
  
    try {
      const user = await User.findOne({ where: { email } });
  
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado!' });
      }
  
      res.status(200).json({ isAdmin: user.isAdmin });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao verificar status de admin' });
    }
  });
  

// Rota para verificar o status VIP de um usuário pelo email
router.get('/is-vip/:email', async (req, res) => {
    const { email } = req.params;

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado!' });
        }

        res.status(200).json({ isVip: user.isVip });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao verificar status VIP' });
    }
});

// Rota para registrar um novo usuário
router.post('/register', async (req, res) => {
    const { password, email, ...users } = req.body;

    const hashpassword = await bcrypt.hash(password, 10);

    const existingemail = await User.findOne({ where: { email } });

    if (existingemail) {
        return res.status(409).json({ error: 'Email já cadastrado!' });
    }

    const createnewuser = await User.create({
        ...users,
        email,
        password: hashpassword,
    });

    res.status(201).json(createnewuser);
});

// Rota para login de usuário
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: "Credenciais incorretas!" });
    }

    const accesstoken = sign({ email: user.email, id: user.id }, process.env.TOKEN_VERIFY_ACCESS);

    res.json({ token: accesstoken, name: user.name });
});

// Rota para o dashboard do usuário
router.get('/dashboard', Authmiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findByPk(userId);
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});
//
router.get('/vip-users', Authmiddleware, isAdmin, async (req, res) => {
    try {
        const vipUsers = await User.findAll({
            where: {
                isVip: true
            },
            attributes: ['name', 'email', 'vipExpirationDate'] // Seleciona apenas os campos necessários
        });

        // Formata os dados para garantir que vipExpirationDate seja uma string
        const formattedVipUsers = vipUsers.map(user => ({
            name: user.name,
            email: user.email,
            vipExpirationDate: user.vipExpirationDate ? user.vipExpirationDate.toISOString() : 'Não definida' // Converte para string ou retorna uma mensagem
        }));

        res.status(200).json(formattedVipUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar usuários VIP." });
    }
});

router.put('/remove-vip/:email', Authmiddleware, isAdmin, async (req, res) => {
    const { email } = req.params;

    try {
        const user = await User.findOne({ where: { email } }); // Busca pelo email
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado!' });
        }

        await user.update({ isVip: false, vipExpirationDate: null });
        res.status(200).json({ message: 'VIP removido com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover VIP.' });
    }
});

router.put('/remove-all-expired-vip', Authmiddleware, isAdmin, async (req, res) => {
    try {
        const expiredUsers = await User.findAll({
            where: {
                isVip: true,
                vipExpirationDate: { [Op.lt]: new Date() } // Filtra apenas os vencidos
            }
        });

        for (const user of expiredUsers) {
            await user.update({ isVip: false, vipExpirationDate: null });
        }

        res.status(200).json({ message: 'VIPs vencidos removidos com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover VIPs vencidos.' });
    }
});

// Rota para pegar dados do usuário logado
router.get('/user-data', Authmiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado!' });
        }

        const benefits = user.isVip ? [
            "Access to 3 years of content with no ads.",
            "Access to all content before it's posted for free users.",
            "VIP badge on our Discord community.",
            "Early access to exclusive content and special newsletters.",
            "Priority support for viewing and accessing all content.",
            "Access Telegram Vipcontent."
        ] : [];

        res.status(200).json({
            name: user.name,
            email: user.email,
            isVip: user.isVip,
            benefits: benefits,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

module.exports = router;

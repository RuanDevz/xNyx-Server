const express = require('express');
const router = express.Router();
const { User } = require('../models');
const bcrypt = require('bcrypt');
const { sign } = require('jsonwebtoken');
const Authmiddleware = require('../Middleware/Auth');
const isAdmin = require('../Middleware/isAdmin'); 
const dotenv = require('dotenv');
const { Op } = require("sequelize"); 

dotenv.config();

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
  
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: 'No subscription found to cancel.' });
      }
  
        await stripe.subscriptions.del(user.stripeSubscriptionId);
  
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

  router.delete('/delete-account/:email', Authmiddleware, async (req, res) => {
    const { email } = req.params;
    const loggedInUserId = req.user.id;

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado!' });
        }

        if (user.id !== loggedInUserId) {
            return res.status(403).json({ error: 'Você não tem permissão para excluir essa conta.' });
        }

        await user.destroy();

        res.status(200).json({ message: 'Conta deletada com sucesso!' });
    } catch (error) {
        console.error("Erro ao deletar conta:", error);
        res.status(500).json({ error: 'Erro interno ao deletar conta.' });
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
        where: { isDisabled: true },  
        attributes: ['id', 'name', 'email', 'vipExpirationDate', 'isDisabled']  
      });
  
      const formattedUsers = vipDisabledUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        vipExpirationDate: user.vipExpirationDate 
          ? user.vipExpirationDate.toISOString() 
          : "Não definida",
        isDisabled: user.isDisabled  
      }));
  
      res.status(200).json(formattedUsers);
    } catch (error) {
      console.error("Erro ao buscar usuários VIP desabilitados:", error);
      res.status(500).json({ error: "Erro ao buscar usuários VIP desabilitados." });
    }
  });
  

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const hashpassword = await bcrypt.hash(password, 10);

        const existingemail = await User.findOne({ where: { email } });

        if (existingemail) {
            return res.status(409).json({ error: 'Email já cadastrado!' });
        }

        const createnewuser = await User.create({
            name,
            email,
            password: hashpassword,
            isVip: false,
            isAdmin: false
        });

        res.status(201).json({
            name: createnewuser.name,
            email: createnewuser.email,
        });

    } catch (error) {
        res.status(500).json({ error: 'Erro ao registrar usuário.' });
    }
});



router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: "Credenciais incorretas!" });
    }

    await user.update({ lastLogin: new Date() });

    const accesstoken = sign({ email: user.email, id: user.id }, process.env.TOKEN_VERIFY_ACCESS);

    res.json({ token: accesstoken, name: user.name });
});

router.get('/dashboard', Authmiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findByPk(userId);

        const now = new Date();
        if (!user.vipExpirationDate || new Date(user.vipExpirationDate) < now) {
            if (user.isVip) {
                await user.update({ isVip: false });
            }
        }
        return res.json({
            name: user.name,
            email: user.email,
            isVip: user.isVip,
            isAdmin: user.isAdmin,
            vipExpirationDate: user.vipExpirationDate,
            lastLogin: user.lastLogin,
            stripeSubscriptionId: user.stripeSubscriptionId,
            recentlyViewed: user.recentlyViewed,
            createdAt: user.createdAt,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});



router.get('/vip-users', Authmiddleware, isAdmin, async (req, res) => {
    try {
        const vipUsers = await User.findAll({
            where: {
                isVip: true
            },
            attributes: ['name', 'email', 'vipExpirationDate'] 
        });

        const formattedVipUsers = vipUsers.map(user => ({
            name: user.name,
            email: user.email,
            vipExpirationDate: user.vipExpirationDate ? user.vipExpirationDate.toISOString() : 'Não definida' 
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
        const user = await User.findOne({ where: { email } }); 
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
                vipExpirationDate: { [Op.lt]: new Date() }
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



router.get('/last-login', Authmiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado!' });
        }

        res.status(200).json({
            name: user.name,
            email: user.email,
            lastLogin: user.lastLogin ? user.lastLogin.toISOString() : 'Nunca logado'
        });
    } catch (error) {
        console.error("Erro ao buscar último login:", error);
        res.status(500).json({ error: 'Erro ao buscar último login' });
    }
});

router.get('/last-login/:email', Authmiddleware, isAdmin, async (req, res) => {
    const { email } = req.params;

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado!' });
        }

        res.status(200).json({
            name: user.name,
            email: user.email,
            lastLogin: user.lastLogin ? user.lastLogin.toISOString() : 'Nunca logado'
        });
    } catch (error) {
        console.error("Erro ao buscar último login:", error);
        res.status(500).json({ error: 'Erro ao buscar último login' });
    }
});



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

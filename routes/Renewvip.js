const express = require('express');
const router = express.Router();
const { User } = require('../models'); // Importe o modelo User

// Rota para renovar o VIP por +30 dias
router.put('/renew-vip/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // Encontre o usuário pelo email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // Calcule a nova data de expiração (30 dias a partir de hoje ou da data atual)
    const currentDate = user.vipExpirationDate ? new Date(user.vipExpirationDate) : new Date();
    const newExpirationDate = new Date(currentDate.setDate(currentDate.getDate() + 30));

    // Atualize o campo vipExpirationDate e defina isDisabled como false e isVip como true
    await User.update(
      { vipExpirationDate: newExpirationDate, isDisabled: false, isVip: true },
      { where: { email } }
    );

    return res.status(200).json({
      message: 'VIP renovado com sucesso por +30 dias.',
      newExpirationDate,
    });
  } catch (error) {
    console.error('Erro ao renovar VIP:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Rota para renovar o VIP por +1 ano
router.put('/renew-vip-year/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // Encontre o usuário pelo email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // Calcule a nova data de expiração (1 ano a partir de hoje ou da data atual)
    const currentDate = user.vipExpirationDate ? new Date(user.vipExpirationDate) : new Date();
    const newExpirationDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));

    // Atualize o campo vipExpirationDate e defina isDisabled como false e isVip como true
    await User.update(
      { vipExpirationDate: newExpirationDate, isDisabled: false, isVip: true },
      { where: { email } }
    );

    return res.status(200).json({
      message: 'VIP renovado com sucesso por +1 ano.',
      newExpirationDate,
    });
  } catch (error) {
    console.error('Erro ao renovar VIP por 1 ano:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

module.exports = router;

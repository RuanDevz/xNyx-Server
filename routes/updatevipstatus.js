const express = require('express');
const { User } = require('../models');
const moment = require('moment');
const router = express.Router();

// Função que recebe o tipo de plano e retorna a data de expiração correspondente
const getVipExpirationDate = (planType) => {
  if (planType === 'monthly') {
    return moment().add(1, 'month').toISOString(); // 30 dias para o plano mensal
  } else if (planType === 'annual') {
    return moment().add(1, 'year').toISOString(); // 1 ano para o plano anual
  }
  throw new Error('Tipo de plano inválido');
};

// Rota para atualizar o status VIP
router.post('/', async (req, res) => {
  const { email, planType } = req.body;

  if (!email || !planType) {
    return res.status(400).json({ error: 'Email e tipo de plano são obrigatórios' });
  }

  // Verificando se o tipo de plano é válido
  if (!['monthly', 'annual'].includes(planType)) {
    return res.status(400).json({ error: 'Tipo de plano inválido. Deve ser "monthly" ou "annual".' });
  }

  try {
    // Buscar o usuário pelo email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Obter a data de expiração baseada no tipo de plano
    let vipExpirationDate = getVipExpirationDate(planType);

    // Se o usuário já for VIP e tiver uma data de expiração futura, somar os dias em vez de sobrescrever
    if (user.isVip && moment(user.vipExpirationDate).isAfter(moment())) {
      if (planType === 'monthly') {
        vipExpirationDate = moment(user.vipExpirationDate).add(1, 'month').toISOString();
      } else if (planType === 'annual') {
        vipExpirationDate = moment(user.vipExpirationDate).add(1, 'year').toISOString();
      }
    }

    // Atualizar o status VIP do usuário
    await User.update(
      { 
        isVip: true, 
        vipExpirationDate: vipExpirationDate 
      },
      { where: { email } }
    );

    res.status(200).json({ message: 'Status VIP do usuário atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar o status VIP:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

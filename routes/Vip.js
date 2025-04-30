const express = require('express');
const router = express.Router();
const { Vip } = require('../models');
const isAdmin = require('../Middleware/isAdmin');
const verifyToken = require('../Middleware/verifyToken');

router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const vipContent = await Vip.findOne({ where: { slug } });
    if (!vipContent) {
      return res.status(404).json({ error: 'Conteúdo VIP não encontrado' });
    }
    res.status(200).json(vipContent);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar o conteúdo VIP por slug: ' + error.message });
  }
});

router.post('/:id/views', async (req, res) => {
  try {
    const { id } = req.params;
    const vipContent = await Vip.findByPk(id);

    if (!vipContent) {
      return res.status(404).json({ error: 'Conteúdo VIP não encontrado' });
    }

    await vipContent.increment('views');

    const updatedVipContent = await Vip.findByPk(id);

    res.status(200).json(updatedVipContent);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao contar a visualização: ' + error.message });
  }
});

router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const vipContents = Array.isArray(req.body) ? req.body : [req.body];
    const createdContents = [];

    for (const content of vipContents) {
      if (!content.slug) {
        return res.status(400).json({ error: 'O campo "slug" é obrigatório.' });
      }

      const existingVip = await Vip.findOne({ where: { slug: content.slug } });
      if (existingVip) {
        return res.status(409).json({ error: `O slug "${content.slug}" já está sendo utilizado.` });
      }

      const createdContent = await Vip.create(content);
      createdContents.push(createdContent);
    }

    res.status(201).json(createdContents);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar os conteúdos VIP', details: error.errors || error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const vipContents = await Vip.findAll();
    res.status(200).json(vipContents);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar os conteúdos VIP: ' + error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const vipContent = await Vip.findByPk(id);
    if (!vipContent) {
      return res.status(404).json({ error: 'Conteúdo VIP não encontrado' });
    }
    res.status(200).json(vipContent);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar o conteúdo VIP: ' + error.message });
  }
});

router.put('/:id', isAdmin, verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, link, category, postDate, slug } = req.body;

    const vipContentToUpdate = await Vip.findByPk(id);
    if (!vipContentToUpdate) {
      return res.status(404).json({ error: 'Conteúdo VIP não encontrado' });
    }

    vipContentToUpdate.name = name;
    vipContentToUpdate.link = link;
    vipContentToUpdate.category = category || vipContentToUpdate.category;
    vipContentToUpdate.postDate = postDate || vipContentToUpdate.postDate;

    if (slug && slug !== vipContentToUpdate.slug) {
      const existingVipWithNewSlug = await Vip.findOne({ where: { slug } });
      if (existingVipWithNewSlug) {
        return res.status(409).json({ error: `O slug "${slug}" já está sendo utilizado.` });
      }
      vipContentToUpdate.slug = slug;
    }

    await vipContentToUpdate.save();

    res.status(200).json(vipContentToUpdate);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar o conteúdo VIP: ' + error.message });
  }
});

router.delete('/:id', isAdmin, verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const vipContentToDelete = await Vip.findByPk(id);
    if (!vipContentToDelete) {
      return res.status(404).json({ error: 'Conteúdo VIP não encontrado' });
    }

    await vipContentToDelete.destroy();
    res.status(200).json({ message: 'Conteúdo VIP deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar o conteúdo VIP: ' + error.message });
  }
});

module.exports = router;
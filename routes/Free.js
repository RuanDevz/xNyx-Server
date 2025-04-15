const express = require('express');
const router = express.Router();
const { Free } = require('../models');
const slugify = require('slugify');
const verifyToken = require('../Middleware/verifyToken');
const isAdmin = require('../Middleware/isAdmin');

router.get('/', async (req, res) => {
  try {
    const freeContents = await Free.findAll();
    res.status(200).json(freeContents);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar os conteúdos gratuitos: ' + error });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const freeContent = await Free.findByPk(id);
    if (!freeContent) {
      return res.status(404).json({ error: 'Conteúdo gratuito não encontrado' });
    }
    res.status(200).json(freeContent);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar o conteúdo gratuito' });
  }
});

router.get('/slug/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const freeContent = await Free.findOne({ where: { slug } });
    if (freeContent) {
      return res.status(200).json(freeContent);
    } else {
      return res.status(404).json({ error: `Conteúdo gratuito com o slug "${slug}" não encontrado.` });
    }
  } catch (error) {
    console.error('Erro ao buscar conteúdo gratuito por slug:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

router.post('/:id/views', async (req, res) => {
  try {
    const { id } = req.params;
    const freeContent = await Free.findByPk(id);

    if (!freeContent) {
      return res.status(404).json({ error: 'Conteúdo gratuito não encontrado' });
    }

    await freeContent.increment('views');
    const updatedFreeContent = await Free.findByPk(id);

    res.status(200).json(updatedFreeContent);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao contar a visualização: ' + error.message });
  }
});

router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const freeContents = Array.isArray(req.body) ? req.body : [req.body];
    const createdContents = [];

    for (const content of freeContents) {
      let slug = content.slug
        ? slugify(content.slug, { lower: true })
        : slugify(content.name, { lower: true });

      let count = 0;
      const originalSlug = slug;

      while (await Free.findOne({ where: { slug } })) {
        count++;
        slug = `${originalSlug}-${count}`;
      }

      const createdContent = await Free.create({ ...content, slug });
      createdContents.push(createdContent);
    }

    res.status(201).json(createdContents);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar os conteúdos gratuitos: ' + error.message });
  }
});


router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, link, link2, category, postDate } = req.body;

    const freeContentToUpdate = await Free.findByPk(id);
    if (!freeContentToUpdate) {
      return res.status(404).json({ error: 'Conteúdo gratuito não encontrado' });
    }

    freeContentToUpdate.name = name;
    freeContentToUpdate.link = link;
    freeContentToUpdate.link2 = link2;
    freeContentToUpdate.category = category;
    freeContentToUpdate.postDate = postDate || freeContentToUpdate.postDate;

    await freeContentToUpdate.save();

    res.status(200).json(freeContentToUpdate);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar o conteúdo gratuito' });
  }
});

router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const freeContentToDelete = await Free.findByPk(id);
    if (!freeContentToDelete) {
      return res.status(404).json({ error: 'Conteúdo gratuito não encontrado' });
    }

    await freeContentToDelete.destroy();
    res.status(200).json({ message: 'Conteúdo gratuito deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar o conteúdo gratuito' });
  }
});

module.exports = router;

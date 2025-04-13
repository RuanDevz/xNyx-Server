const express = require('express');
const router = express.Router();
const { Free } = require('../models');
const slugify = require('slugify');

router.post('/', async (req, res) => {
  try {
    const freeContents = Array.isArray(req.body) ? req.body : [req.body];
    const createdContents = [];

    for (const content of freeContents) {
      if (!content.slug) {
        return res.status(400).json({ error: 'O campo "slug" é obrigatório.' });
      }

      const existingFree = await Free.findOne({ where: { slug: content.slug } });
      if (existingFree) {
        return res.status(409).json({ error: `O slug "${content.slug}" já está sendo utilizado.` });
      }

      const createdContent = await Free.create(content);
      createdContents.push(createdContent);
    }

    res.status(201).json(createdContents);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar os conteúdos gratuitos: ' + error.message });
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

// Rota para contar as views de um conteúdo gratuito (mantendo a rota por ID)
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

// Criar (POST) - Adicionar um novo conteúdo gratuito ou múltiplos conteúdos com geração de slug
router.post('/', async (req, res) => {
  try {
    const freeContents = Array.isArray(req.body) ? req.body : [req.body];
    const createdContents = [];

    for (const content of freeContents) {
      let slug = slugify(content.name, { lower: true });
      let count = 0;
      let originalSlug = slug;

      while (true) {
        const existingFree = await Free.findOne({ where: { slug } });
        if (!existingFree) {
          break;
        }
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

router.get('/', async (req, res) => {
  try {
    const freeContents = await Free.findAll();
    res.status(200).json(freeContents);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar os conteúdos gratuitos: ' + error });
  }
});

// Buscar um conteúdo gratuito por ID (GET) - Mantendo a rota por ID
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

// Atualizar (PUT) - Atualizar conteúdo gratuito (mantendo a atualização sem alterar o slug automaticamente)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, link, category, postDate } = req.body;

    const freeContentToUpdate = await Free.findByPk(id);
    if (!freeContentToUpdate) {
      return res.status(404).json({ error: 'Conteúdo gratuito não encontrado' });
    }

    freeContentToUpdate.name = name;
    freeContentToUpdate.link = link;
    freeContentToUpdate.category = category;
    freeContentToUpdate.postDate = postDate || freeContentToUpdate.postDate;

    await freeContentToUpdate.save();

    res.status(200).json(freeContentToUpdate);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar o conteúdo gratuito' });
  }
});

// Deletar (DELETE) - Deletar conteúdo gratuito
router.delete('/:id', async (req, res) => {
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
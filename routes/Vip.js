const express = require('express');
const router = express.Router();
const { Vip } = require('../models');
const isAdmin = require('../Middleware/isAdmin');
const verifyToken = require('../Middleware/verifyToken');
const { Op, Sequelize } = require('sequelize');

// Função para codificar resposta: base64 + inserção de letras alternadas
function encodeResponse(data) {
  // Converter para JSON string
  const jsonString = JSON.stringify(data);
  
  // Codificar em base64
  const base64 = Buffer.from(jsonString, 'utf8').toString('base64');
  
  // Inserir letras minúsculas alternadamente
  let encoded = '';
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  
  for (let i = 0; i < base64.length; i++) {
    encoded += base64[i];
    // Inserir letra aleatória após cada caractere (exceto o último)
    if (i < base64.length - 1) {
      const randomLetter = letters[Math.floor(Math.random() * letters.length)];
      encoded += randomLetter;
    }
  }
  
  return encoded;
}

// Middleware para codificar resposta JSON
function encryptResponse(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (data) => {
    const encoded = encodeResponse(data);
    originalJson({ data: encoded });
  };

  next();
}

// Aplicar codificação somente nas rotas GET
router.get('/slug/:slug', encryptResponse, async (req, res) => {
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

router.get('/search', encryptResponse, async (req, res) => {
  try {
    const {
      search,
      category,
      month,
      sortBy = 'mostRecent',
      page = 1,
      limit = 24
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    if (search) {
      whereClause.name = {
        [Op.iLike]: `%${search}%`
      };
    }

    if (category) {
      whereClause.category = category;
    }

    if (month) {
      whereClause.createdAt = Sequelize.where(
        Sequelize.fn('date_part', 'month', Sequelize.col('createdAt')),
        month
      );
    }

    let order;
    switch (sortBy) {
      case "mostViewed":
        order = [["views", "DESC"]];
        break;
      case "alphabetical":
        order = [["name", "ASC"]];
        break;
      case "oldContent":
        order = [["createdAt", "ASC"]];
        break;
      case "mostRecent":
      default:
        order = [["createdAt", "DESC"]];
        break;
    }

    const { count, rows } = await Vip.findAndCountAll({
      where: whereClause,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const response = {
      page: parseInt(page),
      perPage: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit),
      data: rows
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar os conteúdos VIP: ' + error.message });
  }
});

router.get('/', encryptResponse, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 24;
    const offset = (page - 1) * limit;

    const { sortBy = 'mostRecent' } = req.query;

    let order;
    switch (sortBy) {
      case "mostViewed":
        order = [["views", "DESC"]];
        break;
      case "alphabetical":
        order = [["name", "ASC"]];
        break;
      case "oldContent":
        order = [["createdAt", "ASC"]];
        break;
      case "mostRecent":
      default:
        order = [["createdAt", "DESC"]];
        break;
    }

    const vipContents = await Vip.findAll({
      limit,
      offset,
      order
    });

    const response = {
      page,
      perPage: limit,
      data: vipContents
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar os conteúdos VIP: ' + error.message });
  }
});

router.get('/:id', encryptResponse, async (req, res) => {
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

// POST, PUT, DELETE não codificados
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

router.put('/:id', isAdmin, verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, link, category, createdAt, slug } = req.body;

    const vipContentToUpdate = await Vip.findByPk(id);
    if (!vipContentToUpdate) {
      return res.status(404).json({ error: 'Conteúdo VIP não encontrado' });
    }

    vipContentToUpdate.name = name;
    vipContentToUpdate.link = link;
    vipContentToUpdate.category = category || vipContentToUpdate.category;
    vipContentToUpdate.createdAt = createdAt || vipContentToUpdate.createdAt;

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
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

router.get('/search', async (req, res) => {
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
      whereClause.postDate = {
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn('date_part', 'month', Sequelize.col('postDate')),
            month
          )
        ]
      };
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
        order = [["postDate", "ASC"]];
        break;
      case "mostRecent":
      default:
        order = [["postDate", "DESC"]];
        break;
    }

    const vipContents = await Vip.findAll({
      where: whereClause,
      order,
      limit,
      offset
    });

    const total = await Vip.count({ where: whereClause });

    const response = {
      page: parseInt(page),
      perPage: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      data: vipContents
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar os conteúdos VIP: ' + error.message });
  }
});

router.get('/', async (req, res) => {
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
        order = [["postDate", "ASC"]];
        break;
      case "mostRecent":
      default:
        order = [["postDate", "DESC"]];
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
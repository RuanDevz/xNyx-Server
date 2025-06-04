const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const { Free, Vip } = require('../models');
const verifyToken = require('../Middleware/verifyToken');
const isAdmin = require('../Middleware/isAdmin');

// Helper function to build where clause
const buildWhereClause = (search, category, month) => {
  const where = {};
  
  if (search) {
    where.name = { [Op.iLike]: `%${search}%` };
  }
  
  if (category) {
    where.category = category;
  }
  
  if (month) {
    where.createdAt = Sequelize.where(
      Sequelize.fn('date_part', 'month', Sequelize.col('createdAt')),
      month
    );
  }
  
  return where;
};

// Helper function to get sort order
const getSortOrder = (sortBy) => {
  switch (sortBy) {
    case "mostViewed":
      return [["views", "DESC"]];
    case "alphabetical":
      return [["name", "ASC"]];
    case "oldContent":
      return [["createdAt", "ASC"]];
    case "mostRecent":
    default:
      return [["createdAt", "DESC"]];
  }
};

// Free content routes
router.get('/free/search', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 24,
      search,
      category,
      month,
      sortBy = 'mostRecent'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = buildWhereClause(search, category, month);
    const order = getSortOrder(sortBy);

    const { count, rows } = await Free.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      page: parseInt(page),
      perPage: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit),
      data: rows
    });

  } catch (error) {
    res.status(500).json({ error: 'Error fetching free content: ' + error.message });
  }
});

// VIP content routes
router.get('/vip/search', verifyToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 24,
      search,
      category,
      month,
      sortBy = 'mostRecent'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = buildWhereClause(search, category, month);
    const order = getSortOrder(sortBy);

    const { count, rows } = await Vip.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      page: parseInt(page),
      perPage: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit),
      data: rows
    });

  } catch (error) {
    res.status(500).json({ error: 'Error fetching VIP content: ' + error.message });
  }
});

// View counting routes
router.post('/free/:id/views', async (req, res) => {
  try {
    const { id } = req.params;
    const content = await Free.findByPk(id);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    await content.increment('views');
    const updated = await Free.findByPk(id);
    
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error updating view count: ' + error.message });
  }
});

router.post('/vip/:id/views', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const content = await Vip.findByPk(id);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    await content.increment('views');
    const updated = await Vip.findByPk(id);
    
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error updating view count: ' + error.message });
  }
});

module.exports = router;
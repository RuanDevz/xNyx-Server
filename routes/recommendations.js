const express = require('express');
const router = express.Router();
const { sendRequestApprovedEmail } = require('../Services/Emailsend');
const db = require("../models");
const Recommendation = db.Recommendation;

// GET - Listar todas as recomendações
router.get('/', async (req, res) => {
  try {
    const recommendations = await Recommendation.findAll({ order: [['createdAt', 'DESC']] });
    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Error fetching recommendations' });
  }
});

// POST - Criar nova recomendação
router.post('/', async (req, res) => {
  try {
    const { title, description, email } = req.body;

    if (!title || !description || !email) {
      return res.status(400).json({ error: 'Title, description, and email are required' });
    }

    const newRecommendation = await Recommendation.create({
      title,
      description,
      email,
      status: 'pending'
    });

    res.status(201).json({
      message: 'Recommendation submitted successfully',
      recommendation: newRecommendation
    });
  } catch (error) {
    console.error('Error creating recommendation:', error);
    res.status(500).json({ error: 'Error creating recommendation' });
  }
});

// POST - Aprovar recomendação
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    const recommendation = await Recommendation.findByPk(id);
    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    recommendation.status = 'approved';
    recommendation.approvedAt = new Date();
    await recommendation.save();

    try {
      await sendRequestApprovedEmail(recommendation.email, recommendation.title);
      console.log(`Approval email sent to ${recommendation.email}`);
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
    }

    res.status(200).json({
      message: 'Recommendation approved successfully',
      recommendation
    });
  } catch (error) {
    console.error('Error approving recommendation:', error);
    res.status(500).json({ error: 'Error approving recommendation' });
  }
});

// POST - Rejeitar recomendação
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;

    const recommendation = await Recommendation.findByPk(id);
    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    recommendation.status = 'rejected';
    recommendation.rejectedAt = new Date();
    await recommendation.save();

    res.status(200).json({
      message: 'Recommendation rejected successfully',
      recommendation
    });
  } catch (error) {
    console.error('Error rejecting recommendation:', error);
    res.status(500).json({ error: 'Error rejecting recommendation' });
  }
});

// DELETE - Deletar recomendação
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const recommendation = await Recommendation.findByPk(id);
    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    await recommendation.destroy();

    res.status(200).json({
      message: 'Recommendation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recommendation:', error);
    res.status(500).json({ error: 'Error deleting recommendation' });
  }
});

module.exports = router;

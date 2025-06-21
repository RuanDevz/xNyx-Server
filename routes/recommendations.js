const express = require('express');
const router = express.Router();
const { sendRequestApprovedEmail } = require('../Services/Emailsend');

// Simulação de banco de dados em memória (substitua pela sua implementação real)
let recommendations = [];
let nextId = 1;

// GET - Listar todas as recomendações
router.get('/', async (req, res) => {
  try {
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

    const newRecommendation = {
      id: nextId++,
      title,
      description,
      email,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    recommendations.push(newRecommendation);

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
    const recommendationIndex = recommendations.findIndex(r => r.id === parseInt(id));

    if (recommendationIndex === -1) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    const recommendation = recommendations[recommendationIndex];
    
    // Atualizar status
    recommendations[recommendationIndex] = {
      ...recommendation,
      status: 'approved',
      approvedAt: new Date().toISOString()
    };

    // Enviar email de aprovação
    try {
      await sendRequestApprovedEmail(recommendation.email, recommendation.title);
      console.log(`Approval email sent to ${recommendation.email} for request: ${recommendation.title}`);
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
      // Não falhar a operação se o email não for enviado
    }

    res.status(200).json({
      message: 'Recommendation approved successfully',
      recommendation: recommendations[recommendationIndex]
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
    const recommendationIndex = recommendations.findIndex(r => r.id === parseInt(id));

    if (recommendationIndex === -1) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    const recommendation = recommendations[recommendationIndex];
    
    // Atualizar status
    recommendations[recommendationIndex] = {
      ...recommendation,
      status: 'rejected',
      rejectedAt: new Date().toISOString()
    };

    res.status(200).json({
      message: 'Recommendation rejected successfully',
      recommendation: recommendations[recommendationIndex]
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
    const recommendationIndex = recommendations.findIndex(r => r.id === parseInt(id));

    if (recommendationIndex === -1) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    recommendations.splice(recommendationIndex, 1);

    res.status(200).json({
      message: 'Recommendation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recommendation:', error);
    res.status(500).json({ error: 'Error deleting recommendation' });
  }
});

module.exports = router;
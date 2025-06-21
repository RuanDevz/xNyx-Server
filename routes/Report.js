const express = require('express');
const router = express.Router();
const { Report, Free, Vip, User } = require('../models');
const verifyToken = require('../Middleware/verifyToken');
const isAdmin = require('../Middleware/isAdmin');
const { sendReportResolvedEmail } = require('../Services/Emailsend');

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

// POST - Criar novo report (não codificado)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { contentId, contentType, reason } = req.body;
    const userId = req.user.id;

    // Verificar se o conteúdo existe
    let content;
    if (contentType === 'free') {
      content = await Free.findByPk(contentId);
    } else if (contentType === 'vip') {
      content = await Vip.findByPk(contentId);
    }

    if (!content) {
      return res.status(404).json({ error: 'Conteúdo não encontrado' });
    }

    // Verificar se o usuário já reportou este conteúdo
    const existingReport = await Report.findOne({
      where: {
        userId,
        contentId,
        contentType
      }
    });

    if (existingReport) {
      return res.status(409).json({ error: 'Você já reportou este conteúdo' });
    }

    // Criar o report
    const report = await Report.create({
      userId,
      contentId,
      contentType,
      reason: reason || 'Link not working',
      reportedAt: new Date()
    });

    res.status(201).json({
      message: 'Report enviado com sucesso',
      report
    });

  } catch (error) {
    console.error('Erro ao criar report:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET - Listar todos os reports para admin (codificado)
router.get('/', verifyToken, isAdmin, encryptResponse, async (req, res) => {
  try {
    const { page = 1, limit = 20, resolved } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (resolved !== undefined) {
      whereClause.resolved = resolved === 'true';
    }

    // Primeiro buscar os reports sem include para evitar erro de associação
    const reportsData = await Report.findAndCountAll({
      where: whereClause,
      order: [['reportedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Buscar informações do usuário e conteúdo para cada report manualmente
    const reportsWithDetails = await Promise.all(
      reportsData.rows.map(async (report) => {
        let user = null;
        let content = null;

        try {
          // Buscar usuário
          user = await User.findByPk(report.userId, {
            attributes: ['id', 'name', 'email']
          });

          // Buscar conteúdo
          if (report.contentType === 'free') {
            content = await Free.findByPk(report.contentId, {
              attributes: ['id', 'name', 'slug', 'category']
            });
          } else if (report.contentType === 'vip') {
            content = await Vip.findByPk(report.contentId, {
              attributes: ['id', 'name', 'slug', 'category']
            });
          }
        } catch (error) {
          console.error('Erro ao buscar detalhes do report:', error);
        }

        return {
          ...report.toJSON(),
          User: user,
          content
        };
      })
    );

    const response = {
      page: parseInt(page),
      perPage: parseInt(limit),
      total: reportsData.count,
      totalPages: Math.ceil(reportsData.count / limit),
      data: reportsWithDetails
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Erro ao buscar reports:', error);
    res.status(500).json({ error: 'Erro ao buscar reports: ' + error.message });
  }
});

// PUT - Marcar report como resolvido (não codificado)
router.put('/:id/resolve', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ error: 'Report não encontrado' });
    }

    // Buscar informações do usuário e conteúdo para o email
    let user = null;
    let content = null;

    try {
      // Buscar usuário
      user = await User.findByPk(report.userId, {
        attributes: ['id', 'name', 'email']
      });

      // Buscar conteúdo
      if (report.contentType === 'free') {
        content = await Free.findByPk(report.contentId, {
          attributes: ['id', 'name', 'slug', 'category']
        });
      } else if (report.contentType === 'vip') {
        content = await Vip.findByPk(report.contentId, {
          attributes: ['id', 'name', 'slug', 'category']
        });
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes para email:', error);
    }

    // Atualizar report
    report.resolved = true;
    report.resolvedAt = new Date();
    await report.save();

    // Enviar email de resolução se temos as informações necessárias
    if (user && user.email && content) {
      try {
        await sendReportResolvedEmail(
          user.email, 
          content.name, 
          report.reason,
          content.slug,
          report.contentType
        );
        console.log(`Resolution email sent to ${user.email} for content: ${content.name}`);
      } catch (emailError) {
        console.error('Error sending resolution email:', emailError);
        // Não falhar a operação se o email não for enviado
      }
    }

    res.status(200).json({
      message: 'Report marcado como resolvido',
      report
    });

  } catch (error) {
    console.error('Erro ao resolver report:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE - Deletar report (não codificado)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ error: 'Report não encontrado' });
    }

    await report.destroy();

    res.status(200).json({
      message: 'Report deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar report:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
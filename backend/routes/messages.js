const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// Validation pour l'envoi de messages
const messageValidation = [
  body('recipient_id')
    .isInt({ min: 1 })
    .withMessage('ID du destinataire invalide'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Le sujet doit contenir entre 1 et 255 caractères'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Le contenu doit contenir entre 1 et 5000 caractères'),
  body('message_type')
    .optional()
    .isIn(['normal', 'urgent', 'info'])
    .withMessage('Type de message invalide')
];

// Route pour récupérer tous les messages de l'utilisateur
router.get('/', async (req, res) => {
  try {
    const { 
      type = 'all', // 'sent', 'received', 'all'
      is_read,
      message_type,
      search,
      page = 1, 
      limit = 20 
    } = req.query;

    const offset = (page - 1) * limit;

    // Construction de la requête selon le type
    let whereClause = '';
    let params = [req.user.id];
    let paramIndex = 2;

    if (type === 'sent') {
      whereClause = 'WHERE m.sender_id = $1';
    } else if (type === 'received') {
      whereClause = 'WHERE m.recipient_id = $1';
    } else {
      whereClause = 'WHERE (m.sender_id = $1 OR m.recipient_id = $1)';
    }

    // Filtres additionnels
    if (is_read !== undefined) {
      whereClause += ` AND m.is_read = $${paramIndex}`;
      params.push(is_read === 'true');
      paramIndex++;
    }

    if (message_type) {
      whereClause += ` AND m.message_type = $${paramIndex}`;
      params.push(message_type);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (m.subject ILIKE $${paramIndex} OR m.content ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Requête principale
    const messagesQuery = `
      SELECT 
        m.id,
        m.subject,
        m.content,
        m.message_type,
        m.is_read,
        m.created_at,
        m.read_at,
        sender.first_name || ' ' || sender.last_name as sender_name,
        sender.email as sender_email,
        recipient.first_name || ' ' || recipient.last_name as recipient_name,
        recipient.email as recipient_email,
        m.sender_id,
        m.recipient_id,
        CASE 
          WHEN m.sender_id = $1 THEN 'sent'
          ELSE 'received'
        END as direction
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users recipient ON m.recipient_id = recipient.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const messagesResult = await query(messagesQuery, params);

    // Compter le total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM messages m
      ${whereClause}
    `;

    const countResult = await query(countQuery, params.slice(0, paramIndex - 2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      messages: messagesResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour récupérer un message spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const messageQuery = `
      SELECT 
        m.id,
        m.subject,
        m.content,
        m.message_type,
        m.is_read,
        m.created_at,
        m.read_at,
        m.parent_message_id,
        sender.first_name || ' ' || sender.last_name as sender_name,
        sender.email as sender_email,
        sender.role as sender_role,
        recipient.first_name || ' ' || recipient.last_name as recipient_name,
        recipient.email as recipient_email,
        recipient.role as recipient_role,
        m.sender_id,
        m.recipient_id
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users recipient ON m.recipient_id = recipient.id
      WHERE m.id = $1 AND (m.sender_id = $2 OR m.recipient_id = $2)
    `;

    const messageResult = await query(messageQuery, [id, req.user.id]);

    if (messageResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Message non trouvé',
        code: 'MESSAGE_NOT_FOUND'
      });
    }

    const message = messageResult.rows[0];

    // Marquer comme lu si c'est le destinataire qui lit
    if (message.recipient_id === req.user.id && !message.is_read) {
      await query(
        'UPDATE messages SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
      message.is_read = true;
      message.read_at = new Date();
    }

    res.json({ message });

  } catch (error) {
    console.error('Erreur lors de la récupération du message:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour envoyer un nouveau message
router.post('/', messageValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { 
      recipient_id, 
      subject, 
      content, 
      message_type = 'normal',
      parent_message_id 
    } = req.body;

    // Vérifier que le destinataire existe
    const recipientResult = await query(
      'SELECT id, first_name, last_name FROM users WHERE id = $1 AND is_active = true',
      [recipient_id]
    );

    if (recipientResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Destinataire non trouvé',
        code: 'RECIPIENT_NOT_FOUND'
      });
    }

    // Insérer le message
    const insertQuery = `
      INSERT INTO messages (
        sender_id, 
        recipient_id, 
        subject, 
        content, 
        message_type,
        parent_message_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const insertResult = await query(insertQuery, [
      req.user.id,
      recipient_id,
      subject.trim(),
      content.trim(),
      message_type,
      parent_message_id || null
    ]);

    const newMessage = insertResult.rows[0];

    // Créer une notification pour le destinataire
    await query(`
      INSERT INTO notifications (
        user_id, 
        title, 
        message, 
        type, 
        action_url
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      recipient_id,
      'Nouveau message',
      `Vous avez reçu un nouveau message de ${req.user.firstName} ${req.user.lastName}`,
      'message',
      `/messages/${newMessage.id}`
    ]);

    res.status(201).json({
      message: 'Message envoyé avec succès',
      data: newMessage
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour marquer un message comme lu
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const updateResult = await query(`
      UPDATE messages 
      SET is_read = true, read_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND recipient_id = $2 AND is_read = false
      RETURNING *
    `, [id, req.user.id]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Message non trouvé ou déjà lu',
        code: 'MESSAGE_NOT_FOUND_OR_READ'
      });
    }

    res.json({
      message: 'Message marqué comme lu',
      data: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Erreur lors du marquage du message:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour supprimer un message
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleteResult = await query(`
      DELETE FROM messages 
      WHERE id = $1 AND (sender_id = $2 OR recipient_id = $2)
      RETURNING *
    `, [id, req.user.id]);

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Message non trouvé',
        code: 'MESSAGE_NOT_FOUND'
      });
    }

    res.json({
      message: 'Message supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du message:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour récupérer une conversation avec un utilisateur
router.get('/conversation/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const conversationQuery = `
      SELECT 
        m.id,
        m.subject,
        m.content,
        m.message_type,
        m.is_read,
        m.created_at,
        m.sender_id,
        m.recipient_id,
        sender.first_name || ' ' || sender.last_name as sender_name,
        CASE 
          WHEN m.sender_id = $1 THEN 'sent'
          ELSE 'received'
        END as direction
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      WHERE (
        (m.sender_id = $1 AND m.recipient_id = $2) OR 
        (m.sender_id = $2 AND m.recipient_id = $1)
      )
      ORDER BY m.created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const conversationResult = await query(conversationQuery, [
      req.user.id, 
      userId, 
      limit, 
      offset
    ]);

    // Marquer les messages reçus comme lus
    await query(`
      UPDATE messages 
      SET is_read = true, read_at = CURRENT_TIMESTAMP 
      WHERE sender_id = $1 AND recipient_id = $2 AND is_read = false
    `, [userId, req.user.id]);

    res.json({
      messages: conversationResult.rows.reverse(), // Ordre chronologique
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la conversation:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour récupérer le nombre de messages non lus
router.get('/unread/count', async (req, res) => {
  try {
    const countResult = await query(
      'SELECT COUNT(*) as unread_count FROM messages WHERE recipient_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({
      unread_count: parseInt(countResult.rows[0].unread_count)
    });

  } catch (error) {
    console.error('Erreur lors du comptage des messages non lus:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
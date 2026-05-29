const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation des données de connexion
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
];

// Route de connexion
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Rechercher l'utilisateur
    const userResult = await query(
      'SELECT id, email, password, role, first_name, last_name, is_active FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = userResult.rows[0];

    // Vérifier si le compte est actif
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Compte désactivé',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Récupérer les informations supplémentaires selon le rôle
    let additionalInfo = {};
    
    if (user.role === 'parent') {
      // Récupérer les enfants du parent
      const childrenResult = await query(`
        SELECT s.id, s.student_number, u.first_name, u.last_name, s.class_name, s.academic_year
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE s.parent_id = $1
        ORDER BY u.first_name, u.last_name
      `, [user.id]);
      
      additionalInfo.children = childrenResult.rows;
    } else if (user.role === 'eleve') {
      // Récupérer les informations de l'élève
      const studentResult = await query(`
        SELECT id, student_number, class_name, academic_year, birth_date
        FROM students
        WHERE user_id = $1
      `, [user.id]);
      
      if (studentResult.rows.length > 0) {
        additionalInfo.studentInfo = studentResult.rows[0];
      }
    }

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        ...additionalInfo
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route de vérification du token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    // Récupérer les informations complètes de l'utilisateur
    const userResult = await query(
      'SELECT id, email, role, first_name, last_name, phone, address FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];

    // Récupérer les informations supplémentaires selon le rôle
    let additionalInfo = {};
    
    if (user.role === 'parent') {
      const childrenResult = await query(`
        SELECT s.id, s.student_number, u.first_name, u.last_name, s.class_name, s.academic_year
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE s.parent_id = $1
        ORDER BY u.first_name, u.last_name
      `, [user.id]);
      
      additionalInfo.children = childrenResult.rows;
    } else if (user.role === 'eleve') {
      const studentResult = await query(`
        SELECT id, student_number, class_name, academic_year, birth_date
        FROM students
        WHERE user_id = $1
      `, [user.id]);
      
      if (studentResult.rows.length > 0) {
        additionalInfo.studentInfo = studentResult.rows[0];
      }
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        address: user.address,
        ...additionalInfo
      }
    });

  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route de déconnexion (côté client principalement)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    message: 'Déconnexion réussie'
  });
});

// Route de changement de mot de passe
router.put('/change-password', [
  authenticateToken,
  body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
  body('newPassword').isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Récupérer le mot de passe actuel
    const userResult = await query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Mot de passe actuel incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Hacher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Mettre à jour le mot de passe
    await query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedNewPassword, req.user.id]
    );

    res.json({
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
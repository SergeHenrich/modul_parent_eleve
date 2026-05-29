const jwt = require('jsonwebtoken');
const { query } = require('../models/database');

// Middleware d'authentification JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Token d\'accès requis',
        code: 'NO_TOKEN'
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier que l'utilisateur existe toujours
    const userResult = await query(
      'SELECT id, email, role, first_name, last_name, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        error: 'Compte désactivé',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Ajouter les informations utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token invalide',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expiré',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Erreur d\'authentification:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Middleware pour vérifier le rôle
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentification requise',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Accès non autorisé pour ce rôle',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: userRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Middleware pour vérifier que l'utilisateur accède à ses propres données
const requireOwnership = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Si c'est un parent, vérifier qu'il accède aux données de ses enfants
    if (req.user.role === 'parent') {
      if (userId) {
        // Vérifier que l'élève appartient bien au parent
        const studentResult = await query(
          'SELECT id FROM students WHERE user_id = $1 AND parent_id = $2',
          [userId, req.user.id]
        );

        if (studentResult.rows.length === 0) {
          return res.status(403).json({
            error: 'Accès non autorisé à ces données',
            code: 'ACCESS_DENIED'
          });
        }
      }
    }
    
    // Si c'est un élève, vérifier qu'il accède à ses propres données
    if (req.user.role === 'eleve' && userId && parseInt(userId) !== req.user.id) {
      return res.status(403).json({
        error: 'Accès non autorisé à ces données',
        code: 'ACCESS_DENIED'
      });
    }

    next();
  } catch (error) {
    console.error('Erreur de vérification de propriété:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Middleware optionnel d'authentification (n'échoue pas si pas de token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userResult = await query(
      'SELECT id, email, role, first_name, last_name, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
      const user = userResult.rows[0];
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnership,
  optionalAuth
};
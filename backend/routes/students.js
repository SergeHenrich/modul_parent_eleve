const express = require('express');
const { query } = require('../models/database');
const { authenticateToken, requireRole, requireOwnership } = require('../middleware/auth');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// Route pour récupérer tous les élèves (pour les parents)
router.get('/', requireRole(['parent']), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE s.parent_id = $1';
    let params = [req.user.id];

    // Ajouter la recherche si fournie
    if (search) {
      whereClause += ' AND (u.first_name ILIKE $3 OR u.last_name ILIKE $3 OR s.student_number ILIKE $3)';
      params.push(`%${search}%`);
    }

    // Requête pour récupérer les élèves
    const studentsQuery = `
      SELECT 
        s.id,
        s.student_number,
        s.class_name,
        s.academic_year,
        s.birth_date,
        s.gender,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        s.created_at
      FROM students s
      JOIN users u ON s.user_id = u.id
      ${whereClause}
      ORDER BY u.first_name, u.last_name
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const studentsResult = await query(studentsQuery, params);

    // Compter le total pour la pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM students s
      JOIN users u ON s.user_id = u.id
      ${whereClause}
    `;

    const countResult = await query(countQuery, params.slice(0, search ? 2 : 1));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      students: studentsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des élèves:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour récupérer un élève spécifique
router.get('/:id', requireOwnership, async (req, res) => {
  try {
    const { id } = req.params;

    const studentQuery = `
      SELECT 
        s.id,
        s.student_number,
        s.class_name,
        s.academic_year,
        s.birth_date,
        s.birth_place,
        s.gender,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.address,
        s.created_at,
        s.updated_at
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
    `;

    const studentResult = await query(studentQuery, [id]);

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Élève non trouvé',
        code: 'STUDENT_NOT_FOUND'
      });
    }

    const student = studentResult.rows[0];

    // Récupérer les statistiques de l'élève
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT g.id) as total_grades,
        ROUND(AVG(g.grade_value), 2) as average_grade,
        COUNT(DISTINCT a.id) as total_absences,
        COUNT(DISTINCT CASE WHEN a.is_justified = false THEN a.id END) as unjustified_absences
      FROM students s
      LEFT JOIN grades g ON s.id = g.student_id
      LEFT JOIN absences a ON s.id = a.student_id
      WHERE s.id = $1
    `;

    const statsResult = await query(statsQuery, [id]);
    const stats = statsResult.rows[0];

    res.json({
      student: {
        ...student,
        statistics: {
          totalGrades: parseInt(stats.total_grades) || 0,
          averageGrade: parseFloat(stats.average_grade) || 0,
          totalAbsences: parseInt(stats.total_absences) || 0,
          unjustifiedAbsences: parseInt(stats.unjustified_absences) || 0
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'élève:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour récupérer les élèves d'un parent spécifique
router.get('/parent/:parentId', requireRole(['parent']), async (req, res) => {
  try {
    const { parentId } = req.params;

    // Vérifier que le parent accède à ses propres données
    if (parseInt(parentId) !== req.user.id) {
      return res.status(403).json({
        error: 'Accès non autorisé',
        code: 'ACCESS_DENIED'
      });
    }

    const studentsQuery = `
      SELECT 
        s.id,
        s.student_number,
        s.class_name,
        s.academic_year,
        u.first_name,
        u.last_name,
        u.email
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.parent_id = $1
      ORDER BY u.first_name, u.last_name
    `;

    const studentsResult = await query(studentsQuery, [parentId]);

    res.json({
      students: studentsResult.rows
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des élèves du parent:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour récupérer le profil de l'élève connecté
router.get('/me/profile', requireRole(['eleve']), async (req, res) => {
  try {
    const studentQuery = `
      SELECT 
        s.id,
        s.student_number,
        s.class_name,
        s.academic_year,
        s.birth_date,
        s.birth_place,
        s.gender,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.address,
        s.created_at
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE u.id = $1
    `;

    const studentResult = await query(studentQuery, [req.user.id]);

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Profil élève non trouvé',
        code: 'STUDENT_PROFILE_NOT_FOUND'
      });
    }

    res.json({
      student: studentResult.rows[0]
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil élève:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
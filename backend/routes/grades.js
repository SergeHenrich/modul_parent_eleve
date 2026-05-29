const express = require('express');
const { query } = require('../models/database');
const { authenticateToken, requireOwnership } = require('../middleware/auth');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// Route pour récupérer les notes d'un élève
router.get('/student/:studentId', requireOwnership, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { 
      trimester, 
      subject_id, 
      grade_type, 
      academic_year,
      page = 1, 
      limit = 20 
    } = req.query;

    const offset = (page - 1) * limit;

    // Construction de la requête avec filtres
    let whereClause = 'WHERE g.student_id = $1';
    let params = [studentId];
    let paramIndex = 2;

    if (trimester) {
      whereClause += ` AND g.trimester = $${paramIndex}`;
      params.push(trimester);
      paramIndex++;
    }

    if (subject_id) {
      whereClause += ` AND g.subject_id = $${paramIndex}`;
      params.push(subject_id);
      paramIndex++;
    }

    if (grade_type) {
      whereClause += ` AND g.grade_type = $${paramIndex}`;
      params.push(grade_type);
      paramIndex++;
    }

    if (academic_year) {
      whereClause += ` AND g.academic_year = $${paramIndex}`;
      params.push(academic_year);
      paramIndex++;
    }

    // Requête principale pour récupérer les notes
    const gradesQuery = `
      SELECT 
        g.id,
        g.grade_value,
        g.grade_type,
        g.trimester,
        g.academic_year,
        g.date_recorded,
        g.teacher_comment,
        s.name as subject_name,
        s.code as subject_code,
        s.coefficient,
        g.created_at
      FROM grades g
      JOIN subjects s ON g.subject_id = s.id
      ${whereClause}
      ORDER BY g.date_recorded DESC, s.name
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const gradesResult = await query(gradesQuery, params);

    // Compter le total pour la pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM grades g
      ${whereClause}
    `;

    const countResult = await query(countQuery, params.slice(0, paramIndex - 2));
    const total = parseInt(countResult.rows[0].total);

    // Calculer les statistiques
    const statsQuery = `
      SELECT 
        trimester,
        COUNT(*) as total_grades,
        ROUND(AVG(grade_value), 2) as average,
        MIN(grade_value) as min_grade,
        MAX(grade_value) as max_grade
      FROM grades g
      WHERE g.student_id = $1
      ${academic_year ? 'AND g.academic_year = $2' : ''}
      GROUP BY trimester
      ORDER BY trimester
    `;

    const statsParams = academic_year ? [studentId, academic_year] : [studentId];
    const statsResult = await query(statsQuery, statsParams);

    res.json({
      grades: gradesResult.rows,
      statistics: statsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des notes:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour récupérer les notes par trimestre
router.get('/student/:studentId/trimester/:trimester', requireOwnership, async (req, res) => {
  try {
    const { studentId, trimester } = req.params;
    const { academic_year } = req.query;

    let whereClause = 'WHERE g.student_id = $1 AND g.trimester = $2';
    let params = [studentId, trimester];

    if (academic_year) {
      whereClause += ' AND g.academic_year = $3';
      params.push(academic_year);
    }

    const gradesQuery = `
      SELECT 
        g.id,
        g.grade_value,
        g.grade_type,
        g.date_recorded,
        g.teacher_comment,
        s.name as subject_name,
        s.code as subject_code,
        s.coefficient
      FROM grades g
      JOIN subjects s ON g.subject_id = s.id
      ${whereClause}
      ORDER BY s.name, g.date_recorded DESC
    `;

    const gradesResult = await query(gradesQuery, params);

    // Calculer la moyenne pondérée par matière
    const subjectAveragesQuery = `
      SELECT 
        s.name as subject_name,
        s.code as subject_code,
        s.coefficient,
        ROUND(AVG(g.grade_value), 2) as average,
        COUNT(g.id) as grade_count
      FROM grades g
      JOIN subjects s ON g.subject_id = s.id
      ${whereClause}
      GROUP BY s.id, s.name, s.code, s.coefficient
      ORDER BY s.name
    `;

    const subjectAveragesResult = await query(subjectAveragesQuery, params);

    // Calculer la moyenne générale pondérée
    let totalPoints = 0;
    let totalCoefficients = 0;

    subjectAveragesResult.rows.forEach(subject => {
      if (subject.average) {
        totalPoints += parseFloat(subject.average) * parseInt(subject.coefficient);
        totalCoefficients += parseInt(subject.coefficient);
      }
    });

    const generalAverage = totalCoefficients > 0 ? (totalPoints / totalCoefficients).toFixed(2) : 0;

    res.json({
      trimester: parseInt(trimester),
      academic_year: academic_year || 'Toutes',
      grades: gradesResult.rows,
      subject_averages: subjectAveragesResult.rows,
      general_average: parseFloat(generalAverage),
      total_grades: gradesResult.rows.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des notes par trimestre:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour récupérer les statistiques des notes d'un élève
router.get('/student/:studentId/statistics', requireOwnership, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academic_year } = req.query;

    let whereClause = 'WHERE g.student_id = $1';
    let params = [studentId];

    if (academic_year) {
      whereClause += ' AND g.academic_year = $2';
      params.push(academic_year);
    }

    // Statistiques générales
    const generalStatsQuery = `
      SELECT 
        COUNT(*) as total_grades,
        ROUND(AVG(grade_value), 2) as overall_average,
        MIN(grade_value) as lowest_grade,
        MAX(grade_value) as highest_grade,
        COUNT(CASE WHEN grade_value >= 10 THEN 1 END) as passing_grades,
        COUNT(CASE WHEN grade_value < 10 THEN 1 END) as failing_grades
      FROM grades g
      ${whereClause}
    `;

    const generalStatsResult = await query(generalStatsQuery, params);

    // Statistiques par trimestre
    const trimesterStatsQuery = `
      SELECT 
        trimester,
        COUNT(*) as grade_count,
        ROUND(AVG(grade_value), 2) as average,
        MIN(grade_value) as min_grade,
        MAX(grade_value) as max_grade
      FROM grades g
      ${whereClause}
      GROUP BY trimester
      ORDER BY trimester
    `;

    const trimesterStatsResult = await query(trimesterStatsQuery, params);

    // Statistiques par matière
    const subjectStatsQuery = `
      SELECT 
        s.name as subject_name,
        s.code as subject_code,
        s.coefficient,
        COUNT(g.id) as grade_count,
        ROUND(AVG(g.grade_value), 2) as average,
        MIN(g.grade_value) as min_grade,
        MAX(g.grade_value) as max_grade
      FROM grades g
      JOIN subjects s ON g.subject_id = s.id
      ${whereClause}
      GROUP BY s.id, s.name, s.code, s.coefficient
      ORDER BY s.name
    `;

    const subjectStatsResult = await query(subjectStatsQuery, params);

    // Évolution des notes (derniers 6 mois)
    const evolutionQuery = `
      SELECT 
        DATE_TRUNC('month', date_recorded) as month,
        ROUND(AVG(grade_value), 2) as average
      FROM grades g
      ${whereClause}
      AND date_recorded >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', date_recorded)
      ORDER BY month
    `;

    const evolutionResult = await query(evolutionQuery, params);

    res.json({
      general: generalStatsResult.rows[0],
      by_trimester: trimesterStatsResult.rows,
      by_subject: subjectStatsResult.rows,
      evolution: evolutionResult.rows,
      academic_year: academic_year || 'Toutes les années'
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour récupérer les matières disponibles
router.get('/subjects', async (req, res) => {
  try {
    const subjectsQuery = `
      SELECT id, name, code, coefficient, description
      FROM subjects
      ORDER BY name
    `;

    const subjectsResult = await query(subjectsQuery);

    res.json({
      subjects: subjectsResult.rows
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des matières:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
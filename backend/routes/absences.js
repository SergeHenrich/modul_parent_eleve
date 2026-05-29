const express = require('express');
const { query } = require('../models/database');
const { authenticateToken, requireOwnership } = require('../middleware/auth');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// Route pour récupérer les absences d'un élève
router.get('/student/:studentId', requireOwnership, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { 
      month, 
      year, 
      is_justified, 
      period,
      page = 1, 
      limit = 20 
    } = req.query;

    const offset = (page - 1) * limit;

    // Construction de la requête avec filtres
    let whereClause = 'WHERE a.student_id = $1';
    let params = [studentId];
    let paramIndex = 2;

    if (month && year) {
      whereClause += ` AND EXTRACT(MONTH FROM a.absence_date) = $${paramIndex} AND EXTRACT(YEAR FROM a.absence_date) = $${paramIndex + 1}`;
      params.push(month, year);
      paramIndex += 2;
    } else if (year) {
      whereClause += ` AND EXTRACT(YEAR FROM a.absence_date) = $${paramIndex}`;
      params.push(year);
      paramIndex++;
    }

    if (is_justified !== undefined) {
      whereClause += ` AND a.is_justified = $${paramIndex}`;
      params.push(is_justified === 'true');
      paramIndex++;
    }

    if (period) {
      whereClause += ` AND a.period = $${paramIndex}`;
      params.push(period);
      paramIndex++;
    }

    // Requête principale pour récupérer les absences
    const absencesQuery = `
      SELECT 
        a.id,
        a.absence_date,
        a.period,
        a.is_justified,
        a.justification_reason,
        a.justification_document,
        a.recorded_by,
        a.created_at,
        s.first_name || ' ' || s.last_name as student_name,
        st.class_name
      FROM absences a
      JOIN students st ON a.student_id = st.id
      JOIN users s ON st.user_id = s.id
      ${whereClause}
      ORDER BY a.absence_date DESC, a.period
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const absencesResult = await query(absencesQuery, params);

    // Compter le total pour la pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM absences a
      ${whereClause}
    `;

    const countResult = await query(countQuery, params.slice(0, paramIndex - 2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      absences: absencesResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des absences:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour récupérer les statistiques des absences d'un élève
router.get('/student/:studentId/statistics', requireOwnership, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { year } = req.query;

    let whereClause = 'WHERE a.student_id = $1';
    let params = [studentId];

    if (year) {
      whereClause += ' AND EXTRACT(YEAR FROM a.absence_date) = $2';
      params.push(year);
    }

    // Statistiques générales
    const generalStatsQuery = `
      SELECT 
        COUNT(*) as total_absences,
        COUNT(CASE WHEN is_justified = true THEN 1 END) as justified_absences,
        COUNT(CASE WHEN is_justified = false THEN 1 END) as unjustified_absences,
        COUNT(CASE WHEN period = 'matin' THEN 1 END) as morning_absences,
        COUNT(CASE WHEN period = 'apres-midi' THEN 1 END) as afternoon_absences,
        COUNT(CASE WHEN period = 'journee' THEN 1 END) as full_day_absences
      FROM absences a
      ${whereClause}
    `;

    const generalStatsResult = await query(generalStatsQuery, params);

    // Statistiques par mois
    const monthlyStatsQuery = `
      SELECT 
        EXTRACT(MONTH FROM absence_date) as month,
        EXTRACT(YEAR FROM absence_date) as year,
        COUNT(*) as total,
        COUNT(CASE WHEN is_justified = true THEN 1 END) as justified,
        COUNT(CASE WHEN is_justified = false THEN 1 END) as unjustified
      FROM absences a
      ${whereClause}
      GROUP BY EXTRACT(YEAR FROM absence_date), EXTRACT(MONTH FROM absence_date)
      ORDER BY year DESC, month DESC
      LIMIT 12
    `;

    const monthlyStatsResult = await query(monthlyStatsQuery, params);

    // Évolution des absences (derniers 6 mois)
    const evolutionQuery = `
      SELECT 
        DATE_TRUNC('month', absence_date) as month,
        COUNT(*) as total_absences,
        COUNT(CASE WHEN is_justified = false THEN 1 END) as unjustified_absences
      FROM absences a
      ${whereClause}
      AND absence_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', absence_date)
      ORDER BY month
    `;

    const evolutionResult = await query(evolutionQuery, params);

    // Absences récentes (dernières 30 jours)
    const recentAbsencesQuery = `
      SELECT 
        absence_date,
        period,
        is_justified,
        justification_reason
      FROM absences a
      ${whereClause}
      AND absence_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY absence_date DESC
      LIMIT 10
    `;

    const recentAbsencesResult = await query(recentAbsencesQuery, params);

    res.json({
      general: generalStatsResult.rows[0],
      monthly: monthlyStatsResult.rows,
      evolution: evolutionResult.rows,
      recent: recentAbsencesResult.rows,
      year: year || 'Toutes les années'
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques d\'absences:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour justifier une absence
router.put('/:absenceId/justify', requireOwnership, async (req, res) => {
  try {
    const { absenceId } = req.params;
    const { justification_reason, justification_document } = req.body;

    if (!justification_reason || justification_reason.trim() === '') {
      return res.status(400).json({
        error: 'La raison de justification est requise',
        code: 'JUSTIFICATION_REQUIRED'
      });
    }

    // Vérifier que l'absence existe et appartient à l'utilisateur
    const checkQuery = `
      SELECT a.id, s.parent_id, s.user_id
      FROM absences a
      JOIN students s ON a.student_id = s.id
      WHERE a.id = $1
    `;

    const checkResult = await query(checkQuery, [absenceId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Absence non trouvée',
        code: 'ABSENCE_NOT_FOUND'
      });
    }

    const absence = checkResult.rows[0];

    // Vérifier les permissions
    const hasPermission = (req.user.role === 'parent' && absence.parent_id === req.user.id) ||
                         (req.user.role === 'eleve' && absence.user_id === req.user.id);

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Accès non autorisé',
        code: 'ACCESS_DENIED'
      });
    }

    // Mettre à jour l'absence
    const updateQuery = `
      UPDATE absences 
      SET 
        is_justified = true,
        justification_reason = $1,
        justification_document = $2
      WHERE id = $3
      RETURNING *
    `;

    const updateResult = await query(updateQuery, [
      justification_reason.trim(),
      justification_document || null,
      absenceId
    ]);

    res.json({
      message: 'Absence justifiée avec succès',
      absence: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Erreur lors de la justification de l\'absence:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour récupérer les absences récentes (pour le dashboard)
router.get('/recent', async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    let whereClause = '';
    let params = [];

    // Filtrer selon le rôle de l'utilisateur
    if (req.user.role === 'parent') {
      whereClause = 'WHERE s.parent_id = $1';
      params.push(req.user.id);
    } else if (req.user.role === 'eleve') {
      whereClause = 'WHERE s.user_id = $1';
      params.push(req.user.id);
    }

    const recentAbsencesQuery = `
      SELECT 
        a.id,
        a.absence_date,
        a.period,
        a.is_justified,
        a.justification_reason,
        u.first_name || ' ' || u.last_name as student_name,
        s.class_name
      FROM absences a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      ${whereClause}
      ORDER BY a.absence_date DESC, a.created_at DESC
      LIMIT $${params.length + 1}
    `;

    params.push(limit);

    const recentAbsencesResult = await query(recentAbsencesQuery, params);

    res.json({
      absences: recentAbsencesResult.rows
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des absences récentes:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour récupérer le calendrier des absences
router.get('/student/:studentId/calendar', requireOwnership, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { year, month } = req.query;

    let whereClause = 'WHERE a.student_id = $1';
    let params = [studentId];

    if (year && month) {
      whereClause += ' AND EXTRACT(YEAR FROM a.absence_date) = $2 AND EXTRACT(MONTH FROM a.absence_date) = $3';
      params.push(year, month);
    } else if (year) {
      whereClause += ' AND EXTRACT(YEAR FROM a.absence_date) = $2';
      params.push(year);
    }

    const calendarQuery = `
      SELECT 
        absence_date,
        period,
        is_justified,
        justification_reason
      FROM absences a
      ${whereClause}
      ORDER BY absence_date
    `;

    const calendarResult = await query(calendarQuery, params);

    // Grouper par date
    const calendar = {};
    calendarResult.rows.forEach(absence => {
      const date = absence.absence_date.toISOString().split('T')[0];
      if (!calendar[date]) {
        calendar[date] = [];
      }
      calendar[date].push({
        period: absence.period,
        is_justified: absence.is_justified,
        justification_reason: absence.justification_reason
      });
    });

    res.json({
      calendar,
      year: year || new Date().getFullYear(),
      month: month || new Date().getMonth() + 1
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du calendrier des absences:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
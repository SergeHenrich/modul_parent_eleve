const { query, testConnection } = require('../models/database');

// Script de migration pour créer les tables de base
const createTables = async () => {
  try {
    console.log('🚀 Début des migrations...');

    // Test de connexion
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Impossible de se connecter à la base de données');
    }

    // Table des utilisateurs (parents et élèves)
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('parent', 'eleve')),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des élèves (informations détaillées)
    await query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        student_number VARCHAR(50) UNIQUE NOT NULL,
        class_name VARCHAR(100) NOT NULL,
        academic_year VARCHAR(20) NOT NULL,
        birth_date DATE,
        birth_place VARCHAR(100),
        gender VARCHAR(10) CHECK (gender IN ('M', 'F')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des matières
    await query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) UNIQUE NOT NULL,
        coefficient INTEGER DEFAULT 1,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des notes
    await query(`
      CREATE TABLE IF NOT EXISTS grades (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
        grade_value DECIMAL(4,2) NOT NULL CHECK (grade_value >= 0 AND grade_value <= 20),
        grade_type VARCHAR(50) NOT NULL, -- 'devoir', 'composition', 'examen'
        trimester INTEGER NOT NULL CHECK (trimester IN (1, 2, 3)),
        academic_year VARCHAR(20) NOT NULL,
        date_recorded DATE DEFAULT CURRENT_DATE,
        teacher_comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des absences
    await query(`
      CREATE TABLE IF NOT EXISTS absences (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        absence_date DATE NOT NULL,
        period VARCHAR(20) NOT NULL, -- 'matin', 'apres-midi', 'journee'
        is_justified BOOLEAN DEFAULT false,
        justification_reason TEXT,
        justification_document VARCHAR(255),
        recorded_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des messages
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        message_type VARCHAR(20) DEFAULT 'normal', -- 'normal', 'urgent', 'info'
        parent_message_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP
      )
    `);

    // Table des notifications
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL, -- 'absence', 'grade', 'message', 'general'
        is_read BOOLEAN DEFAULT false,
        action_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP
      )
    `);

    console.log('✅ Toutes les tables ont été créées avec succès');

    // Insertion de données de test
    await insertTestData();

  } catch (error) {
    console.error('❌ Erreur lors des migrations:', error.message);
    process.exit(1);
  }
};

// Fonction pour insérer des données de test
const insertTestData = async () => {
  try {
    console.log('📝 Insertion des données de test...');

    // Vérifier si des utilisateurs existent déjà
    const existingUsers = await query('SELECT COUNT(*) FROM users');
    if (parseInt(existingUsers.rows[0].count) > 0) {
      console.log('ℹ️ Des données existent déjà, insertion ignorée');
      return;
    }

    // Insérer des matières
    await query(`
      INSERT INTO subjects (name, code, coefficient) VALUES
      ('Mathématiques', 'MATH', 4),
      ('Français', 'FR', 3),
      ('Anglais', 'ANG', 2),
      ('Sciences Physiques', 'PC', 3),
      ('Sciences de la Vie et de la Terre', 'SVT', 2),
      ('Histoire-Géographie', 'HG', 2),
      ('Éducation Physique et Sportive', 'EPS', 1)
    `);

    // Insérer des utilisateurs de test (mot de passe: 'password123')
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 12);

    await query(`
      INSERT INTO users (email, password, role, first_name, last_name, phone) VALUES
      ('parent@edusmart.cm', $1, 'parent', 'Jean', 'Dupont', '+237690123456'),
      ('eleve@edusmart.cm', $1, 'eleve', 'Marie', 'Dupont', '+237690123457')
    `, [hashedPassword]);

    console.log('✅ Données de test insérées avec succès');
    console.log('👤 Comptes créés:');
    console.log('   - Parent: parent@edusmart.cm / password123');
    console.log('   - Élève: eleve@edusmart.cm / password123');

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données de test:', error.message);
  }
};

// Exécuter les migrations si ce script est appelé directement
if (require.main === module) {
  createTables().then(() => {
    console.log('🎉 Migrations terminées avec succès');
    process.exit(0);
  });
}

module.exports = { createTables, insertTestData };
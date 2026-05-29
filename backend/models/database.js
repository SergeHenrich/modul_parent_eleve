const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'edusmart_parent',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // nombre maximum de clients dans le pool
  idleTimeoutMillis: 30000, // temps d'attente avant fermeture d'une connexion inactive
  connectionTimeoutMillis: 2000, // temps d'attente pour obtenir une connexion
});

// Gestion des événements du pool
pool.on('connect', () => {
  console.log('✅ Nouvelle connexion établie avec PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erreur inattendue sur le client PostgreSQL:', err);
  process.exit(-1);
});

// Fonction pour tester la connexion
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('🔗 Connexion à la base de données réussie:', result.rows[0].now);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
    return false;
  }
};

// Fonction utilitaire pour exécuter des requêtes
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Requête exécutée:', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('❌ Erreur lors de l\'exécution de la requête:', err.message);
    throw err;
  }
};

// Fonction pour obtenir un client du pool (pour les transactions)
const getClient = async () => {
  try {
    const client = await pool.connect();
    return client;
  } catch (err) {
    console.error('❌ Erreur lors de l\'obtention du client:', err.message);
    throw err;
  }
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection
};
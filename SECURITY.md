# Guide de Sécurité - EDUSMART-CM

## 🔒 Vue d'ensemble de la Sécurité

EDUSMART-CM implémente une approche de sécurité multicouche pour protéger les données sensibles des élèves et des parents.

## 🛡️ Authentification et Autorisation

### 1. Authentification JWT

```javascript
// Génération de token sécurisé
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'edusmart-cm',
      audience: 'edusmart-users'
    }
  )
}

// Validation de token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'edusmart-cm',
      audience: 'edusmart-users'
    })
  } catch (error) {
    throw new Error('Token invalide')
  }
}
```

### 2. Hachage des Mots de Passe

```javascript
const bcrypt = require('bcryptjs')

// Hachage avec salt rounds élevé
const hashPassword = async (password) => {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// Vérification sécurisée
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash)
}
```

### 3. Contrôle d'Accès Basé sur les Rôles (RBAC)

```javascript
// Middleware de vérification des rôles
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Accès refusé',
        code: 'INSUFFICIENT_PERMISSIONS'
      })
    }
    
    next()
  }
}

// Contrôle d'accès aux données
const requireOwnership = async (req, res, next) => {
  const { studentId } = req.params
  const userId = req.user.id
  
  if (req.user.role === 'parent') {
    const student = await query(
      'SELECT parent_id FROM students WHERE id = $1',
      [studentId]
    )
    
    if (!student.rows.length || student.rows[0].parent_id !== userId) {
      return res.status(403).json({
        error: 'Accès non autorisé à ces données'
      })
    }
  }
  
  next()
}
```

## 🔐 Sécurité des Données

### 1. Validation et Sanitisation

```javascript
const { body, validationResult } = require('express-validator')
const DOMPurify = require('isomorphic-dompurify')

// Validation des entrées
const validateMessage = [
  body('subject')
    .trim()
    .isLength({ min: 1, max: 255 })
    .escape()
    .withMessage('Sujet invalide'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .customSanitizer(value => DOMPurify.sanitize(value))
    .withMessage('Contenu invalide'),
  body('recipient_id')
    .isInt({ min: 1 })
    .withMessage('Destinataire invalide')
]

// Middleware de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Données invalides',
      details: errors.array()
    })
  }
  next()
}
```

### 2. Protection contre l'Injection SQL

```javascript
// Utilisation de requêtes paramétrées
const getGradesByStudent = async (studentId, filters) => {
  const query = `
    SELECT g.*, s.name as subject_name
    FROM grades g
    JOIN subjects s ON g.subject_id = s.id
    WHERE g.student_id = $1
    AND ($2::int IS NULL OR g.trimester = $2)
    ORDER BY g.date_recorded DESC
  `
  
  return await db.query(query, [studentId, filters.trimester || null])
}
```

### 3. Chiffrement des Données Sensibles

```javascript
const crypto = require('crypto')

const algorithm = 'aes-256-gcm'
const secretKey = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32)

// Chiffrement
const encrypt = (text) => {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(algorithm, secretKey, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  }
}

// Déchiffrement
const decrypt = (encryptedData) => {
  const decipher = crypto.createDecipher(
    algorithm, 
    secretKey, 
    Buffer.from(encryptedData.iv, 'hex')
  )
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
```

## 🌐 Sécurité Web

### 1. Headers de Sécurité

```javascript
const helmet = require('helmet')

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.edusmart-cm.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true
}))
```

### 2. Protection CSRF

```javascript
const csrf = require('csurf')

// Configuration CSRF
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
})

// Application du middleware
app.use(csrfProtection)

// Endpoint pour obtenir le token CSRF
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() })
})
```

### 3. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit')
const RedisStore = require('rate-limit-redis')
const redis = require('redis')

const redisClient = redis.createClient()

// Rate limiting général
const generalLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Rate limiting strict pour l'authentification
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentatives de connexion par IP
  skipSuccessfulRequests: true,
  message: {
    error: 'Trop de tentatives de connexion, compte temporairement bloqué'
  }
})

app.use('/api/', generalLimiter)
app.use('/api/auth/login', authLimiter)
```

## 🔍 Audit et Monitoring

### 1. Logging de Sécurité

```javascript
const winston = require('winston')

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: '/var/log/edusmart/security.log',
      level: 'warn'
    }),
    new winston.transports.File({ 
      filename: '/var/log/edusmart/security-error.log',
      level: 'error'
    })
  ]
})

// Middleware de logging des événements de sécurité
const logSecurityEvent = (event, details) => {
  securityLogger.warn({
    event,
    details,
    timestamp: new Date().toISOString(),
    ip: details.ip,
    userAgent: details.userAgent
  })
}

// Exemples d'utilisation
app.use('/api/auth/login', (req, res, next) => {
  const originalSend = res.send
  
  res.send = function(data) {
    const response = JSON.parse(data)
    
    if (res.statusCode === 401) {
      logSecurityEvent('FAILED_LOGIN_ATTEMPT', {
        email: req.body.email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      })
    }
    
    originalSend.call(this, data)
  }
  
  next()
})
```

### 2. Détection d'Intrusion

```javascript
const suspiciousActivityDetector = (req, res, next) => {
  const ip = req.ip
  const userAgent = req.get('User-Agent')
  
  // Détection de patterns suspects
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /burp/i,
    /<script>/i,
    /union.*select/i,
    /drop.*table/i
  ]
  
  const requestString = JSON.stringify(req.body) + req.url + userAgent
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestString)) {
      logSecurityEvent('SUSPICIOUS_ACTIVITY_DETECTED', {
        pattern: pattern.toString(),
        ip,
        userAgent,
        url: req.url,
        body: req.body
      })
      
      return res.status(403).json({
        error: 'Activité suspecte détectée'
      })
    }
  }
  
  next()
}

app.use(suspiciousActivityDetector)
```

## 🔧 Configuration de Sécurité

### 1. Variables d'Environnement

```bash
# .env.production
NODE_ENV=production

# Clés de sécurité (générer avec crypto.randomBytes(64).toString('hex'))
JWT_SECRET=votre_cle_jwt_super_securisee_de_64_caracteres_minimum_ici
ENCRYPTION_KEY=votre_cle_de_chiffrement_super_securisee_de_64_caracteres

# Base de données
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true

# Session
SESSION_SECRET=votre_secret_de_session_super_securise
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict

# HTTPS
FORCE_HTTPS=true
HSTS_MAX_AGE=31536000

# Rate limiting
REDIS_URL=redis://localhost:6379
```

### 2. Configuration Nginx Sécurisée

```nginx
server {
    listen 443 ssl http2;
    server_name edusmart-cm.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/edusmart-cm.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/edusmart-cm.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self';" always;

    # Hide server information
    server_tokens off;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=1r/s;

    location /api/auth {
        limit_req zone=auth burst=3 nodelay;
        proxy_pass http://localhost:5000;
    }

    location /api {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:5000;
    }
}
```

## 🚨 Plan de Réponse aux Incidents

### 1. Détection d'Incident

```javascript
// Système d'alerte automatique
const alertSystem = {
  async sendAlert(severity, message, details) {
    const alert = {
      timestamp: new Date().toISOString(),
      severity,
      message,
      details,
      system: 'EDUSMART-CM'
    }

    // Log critique
    securityLogger.error(alert)

    // Notification immédiate pour les incidents critiques
    if (severity === 'CRITICAL') {
      await this.notifySecurityTeam(alert)
    }
  },

  async notifySecurityTeam(alert) {
    // Envoi d'email d'urgence
    // Notification SMS
    // Webhook vers système de monitoring
  }
}

// Détection d'attaque par force brute
const bruteForceDetector = new Map()

app.use('/api/auth/login', (req, res, next) => {
  const ip = req.ip
  const attempts = bruteForceDetector.get(ip) || 0

  if (attempts > 10) {
    alertSystem.sendAlert('HIGH', 'Possible attaque par force brute détectée', {
      ip,
      attempts,
      userAgent: req.get('User-Agent')
    })

    return res.status(429).json({
      error: 'IP temporairement bloquée'
    })
  }

  next()
})
```

### 2. Procédures d'Urgence

```bash
#!/bin/bash
# emergency-response.sh

# Blocage d'IP suspecte
block_ip() {
    local ip=$1
    echo "Blocage de l'IP: $ip"
    iptables -A INPUT -s $ip -j DROP
    echo "$ip bloquée à $(date)" >> /var/log/blocked-ips.log
}

# Rotation d'urgence des secrets
rotate_secrets() {
    echo "Rotation d'urgence des secrets..."
    
    # Génération de nouveaux secrets
    new_jwt_secret=$(openssl rand -hex 64)
    new_encryption_key=$(openssl rand -hex 64)
    
    # Sauvegarde des anciens secrets
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    
    # Mise à jour des secrets
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$new_jwt_secret/" .env
    sed -i "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$new_encryption_key/" .env
    
    # Redémarrage de l'application
    pm2 restart edusmart-backend
    
    echo "Secrets rotés avec succès"
}

# Isolation du système
isolate_system() {
    echo "Isolation du système en cours..."
    
    # Arrêt des services non critiques
    pm2 stop edusmart-backend
    
    # Activation du mode maintenance
    cp maintenance.html /var/www/html/index.html
    
    echo "Système isolé - Mode maintenance activé"
}
```

## ✅ Checklist de Sécurité

### Authentification et Autorisation
- [ ] JWT avec secret fort (64+ caractères)
- [ ] Hachage bcrypt avec salt rounds ≥ 12
- [ ] Contrôle d'accès basé sur les rôles
- [ ] Validation de propriété des données
- [ ] Expiration automatique des sessions

### Protection des Données
- [ ] Validation et sanitisation des entrées
- [ ] Requêtes SQL paramétrées
- [ ] Chiffrement des données sensibles
- [ ] Anonymisation des logs
- [ ] Sauvegarde chiffrée

### Sécurité Web
- [ ] Headers de sécurité (Helmet.js)
- [ ] Protection CSRF
- [ ] Rate limiting configuré
- [ ] HTTPS forcé
- [ ] Cookies sécurisés

### Monitoring et Audit
- [ ] Logging des événements de sécurité
- [ ] Détection d'intrusion
- [ ] Alertes automatiques
- [ ] Audit régulier des accès
- [ ] Plan de réponse aux incidents

### Infrastructure
- [ ] Firewall configuré
- [ ] Fail2Ban activé
- [ ] Certificats SSL valides
- [ ] Sauvegardes automatiques
- [ ] Mise à jour de sécurité

---

**Contact Sécurité**: security@nexatec-solutions.cm  
**Hotline Incidents**: +237 690 123 456
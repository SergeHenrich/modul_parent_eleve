# API Documentation - EDUSMART-CM Portail Parent/Élève

## 📋 Vue d'ensemble

Cette API REST permet aux parents et élèves d'accéder aux informations scolaires via le portail EDUSMART-CM.

**Base URL**: `http://localhost:5000/api`

## 🔐 Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification.

### Headers requis
```
Authorization: Bearer <token>
Content-Type: application/json
```

## 📚 Endpoints

### 🔑 Authentification

#### POST /auth/login
Connexion utilisateur

**Body:**
```json
{
  "email": "parent@edusmart.cm",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "parent@edusmart.cm",
    "role": "parent",
    "firstName": "Jean",
    "lastName": "Dupont",
    "children": [...]
  }
}
```

#### GET /auth/verify
Vérifier la validité du token

**Response:**
```json
{
  "valid": true,
  "user": { ... }
}
```

#### POST /auth/logout
Déconnexion

#### PUT /auth/change-password
Changer le mot de passe

**Body:**
```json
{
  "currentPassword": "ancien_mot_de_passe",
  "newPassword": "nouveau_mot_de_passe"
}
```

### 👥 Élèves

#### GET /students
Récupérer les élèves (pour parents)

**Query params:**
- `page`: Numéro de page (défaut: 1)
- `limit`: Nombre d'éléments par page (défaut: 10)
- `search`: Recherche par nom ou numéro d'élève

#### GET /students/:id
Récupérer un élève spécifique avec ses statistiques

#### GET /students/parent/:parentId
Récupérer les élèves d'un parent

#### GET /students/me/profile
Récupérer le profil de l'élève connecté

### 📊 Notes

#### GET /grades/student/:studentId
Récupérer les notes d'un élève

**Query params:**
- `trimester`: Filtrer par trimestre (1, 2, 3)
- `subject_id`: Filtrer par matière
- `grade_type`: Type de note (devoir, composition, examen)
- `academic_year`: Année scolaire
- `page`, `limit`: Pagination

**Response:**
```json
{
  "grades": [
    {
      "id": 1,
      "grade_value": 15.5,
      "grade_type": "devoir",
      "trimester": 1,
      "subject_name": "Mathématiques",
      "coefficient": 4,
      "date_recorded": "2024-01-15"
    }
  ],
  "statistics": [
    {
      "trimester": 1,
      "average": 14.2,
      "total_grades": 12
    }
  ],
  "pagination": { ... }
}
```

#### GET /grades/student/:studentId/trimester/:trimester
Notes par trimestre avec moyennes

#### GET /grades/student/:studentId/statistics
Statistiques complètes des notes

#### GET /grades/subjects
Liste des matières disponibles

### 🚫 Absences

#### GET /absences/student/:studentId
Récupérer les absences d'un élève

**Query params:**
- `month`, `year`: Filtrer par mois/année
- `is_justified`: Filtrer par justification (true/false)
- `period`: Période (matin, apres-midi, journee)

#### GET /absences/student/:studentId/statistics
Statistiques des absences

#### PUT /absences/:absenceId/justify
Justifier une absence

**Body:**
```json
{
  "justification_reason": "Rendez-vous médical",
  "justification_document": "certificat_medical.pdf"
}
```

#### GET /absences/recent
Absences récentes (pour dashboard)

#### GET /absences/student/:studentId/calendar
Calendrier des absences

### 💬 Messages

#### GET /messages
Récupérer les messages

**Query params:**
- `type`: Type (sent, received, all)
- `is_read`: Filtrer par statut de lecture
- `message_type`: Type de message (normal, urgent, info)
- `search`: Recherche dans sujet/contenu

#### GET /messages/:id
Récupérer un message spécifique

#### POST /messages
Envoyer un nouveau message

**Body:**
```json
{
  "recipient_id": 2,
  "subject": "Sujet du message",
  "content": "Contenu du message",
  "message_type": "normal",
  "parent_message_id": null
}
```

#### PUT /messages/:id/read
Marquer un message comme lu

#### DELETE /messages/:id
Supprimer un message

#### GET /messages/conversation/:userId
Récupérer une conversation avec un utilisateur

#### GET /messages/unread/count
Nombre de messages non lus

### 🔔 Notifications

#### GET /notifications
Récupérer les notifications

#### PUT /notifications/:id/read
Marquer une notification comme lue

#### PUT /notifications/read-all
Marquer toutes les notifications comme lues

#### GET /notifications/unread-count
Nombre de notifications non lues

## 📋 Codes d'erreur

| Code | Description |
|------|-------------|
| `NO_TOKEN` | Token d'accès manquant |
| `INVALID_TOKEN` | Token invalide |
| `TOKEN_EXPIRED` | Token expiré |
| `USER_NOT_FOUND` | Utilisateur non trouvé |
| `ACCOUNT_DISABLED` | Compte désactivé |
| `INVALID_CREDENTIALS` | Identifiants incorrects |
| `ACCESS_DENIED` | Accès non autorisé |
| `INSUFFICIENT_PERMISSIONS` | Permissions insuffisantes |
| `STUDENT_NOT_FOUND` | Élève non trouvé |
| `MESSAGE_NOT_FOUND` | Message non trouvé |
| `INTERNAL_ERROR` | Erreur interne du serveur |

## 🔒 Sécurité

### Authentification
- JWT avec expiration (24h par défaut)
- Hachage bcrypt pour les mots de passe (12 rounds)
- Validation des tokens à chaque requête

### Autorisation
- Vérification des rôles (parent/élève)
- Contrôle d'accès aux données (parents → leurs enfants, élèves → leurs données)
- Middleware de protection des routes

### Validation
- Validation des entrées avec express-validator
- Sanitisation des données
- Limitation du taux de requêtes (100 req/15min)

### Headers de sécurité
- Helmet.js activé
- CORS configuré
- Protection XSS

## 📊 Pagination

Format standard pour les réponses paginées:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## 🚀 Exemples d'utilisation

### Connexion et récupération des notes
```javascript
// 1. Connexion
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'parent@edusmart.cm',
    password: 'password123'
  })
});

const { token, user } = await loginResponse.json();

// 2. Récupération des notes du premier enfant
const gradesResponse = await fetch(`/api/grades/student/${user.children[0].id}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const grades = await gradesResponse.json();
```

### Envoi d'un message
```javascript
const messageResponse = await fetch('/api/messages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recipient_id: 5,
    subject: 'Question sur les devoirs',
    content: 'Bonjour, j\'aimerais avoir des précisions...',
    message_type: 'normal'
  })
});
```

## 🔧 Configuration

### Variables d'environnement
```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edusmart_parent
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=24h

# Serveur
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## 📈 Monitoring

### Route de santé
```
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

## 🐛 Gestion d'erreurs

Format standard des erreurs:

```json
{
  "error": "Description de l'erreur",
  "code": "ERROR_CODE",
  "details": [...] // Optionnel pour les erreurs de validation
}
```

## 📝 Notes de version

### v1.0.0
- Authentification JWT
- CRUD complet pour élèves, notes, absences, messages
- Système de notifications
- Statistiques et rapports
- API REST complète avec pagination
- Documentation Swagger (à venir)

---

**Développé par**: NEXATEC SOLUTIONS SARL  
**Contact**: support@nexatec-solutions.cm  
**Licence**: MIT
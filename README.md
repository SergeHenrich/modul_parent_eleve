# EDUSMART-CM - Module Parent/Élève

## 📋 Description du projet

EDUSMART-CM est une plateforme web de gestion scolaire développée pour le Ministère des Enseignements Secondaires (MINESEC) du Cameroun. Ce module est le **Portail Parent/Élève** qui permet:

- 👨‍💼 **Parents**: Suivre les résultats et absences de leurs enfants
- 👦 **Élèves**: Consulter leurs notes et messages
- 💬 **Messagerie**: Communication bidirectionnelle avec l'établissement
- 🔔 **Notifications**: Alertes SMS/Email pour les événements importants

## 🏗️ Architecture

### Stack technique

| Couche               | Technologies                   |
| -------------------- | ------------------------------ |
| **Frontend**         | React 18 + Vite + Tailwind CSS |
| **Backend**          | Node.js + Express.js           |
| **Base de données**  | PostgreSQL                     |
| **Authentification** | JWT + bcrypt                   |
| **Styling**          | Tailwind CSS + Lucide Icons    |

### Structure du projet

```
edusmart-portail-parent/
├── backend/
│   ├── migrations/       # Migrations BD
│   ├── models/           # Connexion BD
│   ├── middleware/       # Authentification, etc.
│   ├── routes/           # Endpoints API
│   ├── .env              # Variables d'env
│   └── server.js         # Point d'entrée
├── frontend/
│   ├── src/
│   │   ├── components/   # Composants réutilisables
│   │   ├── contexts/     # React Context (Auth)
│   │   ├── pages/        # Pages/routes
│   │   ├── services/     # API client
│   │   └── App.jsx       # Routing principal
│   ├── .env              # Variables Vite
│   └── vite.config.js    # Config Vite
├── API.md                # Documentation API
└── README.md             # Ce fichier
```

## 🚀 Installation et démarrage

### Prérequis

- Node.js 16+
- PostgreSQL 12+
- Git

### 1. Cloner et installer

```bash
git clone <repo-url>
cd edusmart-portail-parent

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## 👤 Comptes de test

| Rôle   | Email                | Mot de passe |
| ------ | -------------------- | ------------ |
| Parent | `parent@edusmart.cm` | `parent123`  |
| Élève  | `eleve@edusmart.cm`  | `eleve123`   |

## 📞 Contact et Support

- **Email**: support@nexatec-solutions.cm
- **Equipe**: NEXATEC SOLUTIONS SARL
- **Lieu**: Yaoundé, Cameroun

## 📄 Licence

MIT License - Voir LICENSE.md

---

**Status**: 🚧 En développement
# Guide de Déploiement - EDUSMART-CM

## 📋 Prérequis

### Serveur de production
- **OS**: Ubuntu 20.04 LTS ou plus récent
- **RAM**: Minimum 2GB, recommandé 4GB
- **CPU**: 2 vCPUs minimum
- **Stockage**: 20GB minimum
- **Node.js**: Version 18.x ou plus récent
- **PostgreSQL**: Version 12 ou plus récent
- **Nginx**: Pour le reverse proxy
- **SSL**: Certificat SSL valide

### Domaine et DNS
- Nom de domaine configuré
- Enregistrements DNS pointant vers le serveur
- Certificat SSL (Let's Encrypt recommandé)

## 🚀 Déploiement Backend

### 1. Préparation du serveur

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation de PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Installation de Nginx
sudo apt install nginx -y

# Installation de PM2 pour la gestion des processus
sudo npm install -g pm2
```

### 2. Configuration de PostgreSQL

```bash
# Connexion à PostgreSQL
sudo -u postgres psql

# Création de la base de données et de l'utilisateur
CREATE DATABASE edusmart_parent;
CREATE USER edusmart_user WITH ENCRYPTED PASSWORD 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE edusmart_parent TO edusmart_user;
\q
```

### 3. Déploiement de l'application

```bash
# Création du répertoire de l'application
sudo mkdir -p /var/www/edusmart-backend
sudo chown $USER:$USER /var/www/edusmart-backend

# Clonage du repository
cd /var/www/edusmart-backend
git clone <votre-repo-url> .

# Installation des dépendances
cd backend
npm install --production

# Configuration des variables d'environnement
cp .env.example .env
nano .env
```

### 4. Configuration du fichier .env

```env
# Production environment
NODE_ENV=production
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edusmart_parent
DB_USER=edusmart_user
DB_PASSWORD=votre_mot_de_passe_securise

# JWT
JWT_SECRET=votre_cle_jwt_super_securisee_de_64_caracteres_minimum
JWT_EXPIRES_IN=24h

# CORS
FRONTEND_URL=https://votre-domaine.com

# Email (optionnel)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-app

# SMS (optionnel)
SMS_API_KEY=votre_cle_api_sms
SMS_SENDER=EDUSMART
```

### 5. Exécution des migrations

```bash
cd /var/www/edusmart-backend/backend
npm run migrate
```

### 6. Configuration PM2

```bash
# Création du fichier ecosystem
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'edusmart-backend',
    script: 'server.js',
    cwd: '/var/www/edusmart-backend/backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/edusmart/error.log',
    out_file: '/var/log/edusmart/out.log',
    log_file: '/var/log/edusmart/combined.log',
    time: true
  }]
}
EOF

# Création du répertoire de logs
sudo mkdir -p /var/log/edusmart
sudo chown $USER:$USER /var/log/edusmart

# Démarrage de l'application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🌐 Déploiement Frontend

### 1. Build de production

```bash
# Sur votre machine de développement ou serveur CI/CD
cd frontend
npm install
npm run build

# Upload du dossier dist vers le serveur
scp -r dist/ user@votre-serveur:/var/www/edusmart-frontend/
```

### 2. Configuration Nginx

```bash
# Création du fichier de configuration
sudo nano /etc/nginx/sites-available/edusmart
```

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com www.votre-domaine.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Frontend
    location / {
        root /var/www/edusmart-frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
```

### 3. Activation du site

```bash
# Activation du site
sudo ln -s /etc/nginx/sites-available/edusmart /etc/nginx/sites-enabled/

# Test de la configuration
sudo nginx -t

# Redémarrage de Nginx
sudo systemctl restart nginx
```

## 🔒 Configuration SSL avec Let's Encrypt

```bash
# Installation de Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtention du certificat SSL
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Configuration du renouvellement automatique
sudo crontab -e
# Ajouter cette ligne :
0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring et Logs

### 1. Configuration des logs

```bash
# Rotation des logs PM2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

# Logs Nginx
sudo nano /etc/logrotate.d/nginx
```

### 2. Monitoring avec PM2

```bash
# Monitoring en temps réel
pm2 monit

# Status des processus
pm2 status

# Logs en temps réel
pm2 logs

# Redémarrage de l'application
pm2 restart edusmart-backend
```

## 🔄 Mise à jour de l'application

### Script de déploiement automatique

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Déploiement EDUSMART-CM..."

# Variables
REPO_URL="votre-repo-url"
APP_DIR="/var/www/edusmart-backend"
FRONTEND_DIR="/var/www/edusmart-frontend"

# Backend
echo "📦 Mise à jour du backend..."
cd $APP_DIR
git pull origin main
cd backend
npm install --production
npm run migrate

# Redémarrage PM2
pm2 restart edusmart-backend

# Frontend
echo "🌐 Mise à jour du frontend..."
cd $APP_DIR/frontend
npm install
npm run build
sudo cp -r dist/* $FRONTEND_DIR/

# Test Nginx
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Déploiement terminé avec succès!"
```

## 🛡️ Sécurité

### 1. Firewall

```bash
# Configuration UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. Fail2Ban

```bash
# Installation
sudo apt install fail2ban -y

# Configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Redémarrage
sudo systemctl restart fail2ban
```

### 3. Sauvegarde automatique

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/edusmart"
DATE=$(date +%Y%m%d_%H%M%S)

# Création du répertoire de sauvegarde
mkdir -p $BACKUP_DIR

# Sauvegarde de la base de données
pg_dump -h localhost -U edusmart_user edusmart_parent > $BACKUP_DIR/db_backup_$DATE.sql

# Sauvegarde des fichiers
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/www/edusmart-backend

# Nettoyage des anciennes sauvegardes (garde 7 jours)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Sauvegarde terminée: $DATE"
```

### 4. Crontab pour les sauvegardes

```bash
# Ajout au crontab
sudo crontab -e

# Sauvegarde quotidienne à 2h du matin
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

## 📋 Checklist de déploiement

- [ ] Serveur configuré avec les prérequis
- [ ] Base de données PostgreSQL créée et configurée
- [ ] Variables d'environnement configurées
- [ ] Migrations exécutées
- [ ] Backend déployé avec PM2
- [ ] Frontend buildé et déployé
- [ ] Nginx configuré avec SSL
- [ ] Certificat SSL installé et configuré
- [ ] Firewall configuré
- [ ] Monitoring et logs configurés
- [ ] Sauvegardes automatiques configurées
- [ ] Tests de fonctionnement effectués

## 🆘 Dépannage

### Problèmes courants

1. **Erreur de connexion à la base de données**
   - Vérifier les credentials dans .env
   - Vérifier que PostgreSQL est démarré
   - Tester la connexion manuellement

2. **Erreur 502 Bad Gateway**
   - Vérifier que PM2 est démarré
   - Vérifier les logs PM2
   - Vérifier la configuration Nginx

3. **Problèmes de certificat SSL**
   - Vérifier la configuration Certbot
   - Renouveler le certificat manuellement
   - Vérifier les permissions des fichiers

### Commandes utiles

```bash
# Status des services
sudo systemctl status nginx
sudo systemctl status postgresql
pm2 status

# Logs
sudo tail -f /var/log/nginx/error.log
pm2 logs edusmart-backend
sudo journalctl -u nginx -f

# Redémarrage des services
sudo systemctl restart nginx
sudo systemctl restart postgresql
pm2 restart all
```

---

**Support**: support@nexatec-solutions.cm  
**Documentation**: https://docs.edusmart-cm.com
# Guide d'Optimisation des Performances - EDUSMART-CM

## 📊 Métriques de Performance Cibles

### Frontend
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms
- **Time to Interactive (TTI)**: < 3.5s

### Backend
- **Temps de réponse API**: < 200ms (95e percentile)
- **Throughput**: > 1000 req/s
- **Disponibilité**: > 99.9%
- **Temps de connexion DB**: < 50ms

## 🚀 Optimisations Frontend

### 1. Code Splitting et Lazy Loading

```javascript
// Lazy loading des pages
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'))
const Grades = lazy(() => import('./pages/Grades/Grades'))
const Messages = lazy(() => import('./pages/Messages/Messages'))

// Lazy loading des composants lourds
const Chart = lazy(() => import('./components/Chart'))
const DataTable = lazy(() => import('./components/DataTable'))
```

### 2. Optimisation des Images

```javascript
// Utilisation de formats modernes
const ImageOptimized = ({ src, alt, ...props }) => (
  <picture>
    <source srcSet={`${src}.webp`} type="image/webp" />
    <source srcSet={`${src}.avif`} type="image/avif" />
    <img src={`${src}.jpg`} alt={alt} {...props} />
  </picture>
)

// Lazy loading des images
const LazyImage = ({ src, alt, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={imgRef} {...props}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          style={{ opacity: isLoaded ? 1 : 0 }}
        />
      )}
    </div>
  )
}
```

### 3. Optimisation des Requêtes API

```javascript
// Cache des requêtes avec React Query
import { useQuery, useMutation, useQueryClient } from 'react-query'

const useGrades = (studentId, options = {}) => {
  return useQuery(
    ['grades', studentId],
    () => gradesAPI.getByStudent(studentId),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      ...options
    }
  )
}

// Prefetching des données
const prefetchGrades = (studentId) => {
  queryClient.prefetchQuery(
    ['grades', studentId],
    () => gradesAPI.getByStudent(studentId)
  )
}
```

### 4. Optimisation du Bundle

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', 'react-hot-toast'],
          charts: ['recharts'],
          utils: ['axios', 'date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
```

### 5. Service Worker pour le Cache

```javascript
// sw.js
const CACHE_NAME = 'edusmart-v1'
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response
        }
        return fetch(event.request)
      })
  )
})
```

## ⚡ Optimisations Backend

### 1. Optimisation des Requêtes SQL

```sql
-- Index pour améliorer les performances
CREATE INDEX idx_grades_student_trimester ON grades(student_id, trimester);
CREATE INDEX idx_absences_student_date ON absences(student_id, absence_date);
CREATE INDEX idx_messages_recipient_read ON messages(recipient_id, is_read);

-- Requête optimisée avec pagination
SELECT g.*, s.name as subject_name 
FROM grades g 
JOIN subjects s ON g.subject_id = s.id 
WHERE g.student_id = $1 
ORDER BY g.date_recorded DESC 
LIMIT $2 OFFSET $3;
```

### 2. Cache Redis

```javascript
const redis = require('redis')
const client = redis.createClient()

// Cache des données fréquemment consultées
const getCachedGrades = async (studentId) => {
  const cacheKey = `grades:${studentId}`
  const cached = await client.get(cacheKey)
  
  if (cached) {
    return JSON.parse(cached)
  }
  
  const grades = await getGradesFromDB(studentId)
  await client.setex(cacheKey, 300, JSON.stringify(grades)) // 5 min cache
  
  return grades
}
```

### 3. Connection Pooling

```javascript
// models/database.js
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // nombre maximum de connexions
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
```

### 4. Compression et Minification

```javascript
// server.js
const compression = require('compression')
const helmet = require('helmet')

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false
    }
    return compression.filter(req, res)
  }
}))

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}))
```

## 📊 Monitoring et Métriques

### 1. Monitoring Frontend

```javascript
// Performance monitoring
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'navigation') {
      console.log('Page Load Time:', entry.loadEventEnd - entry.loadEventStart)
    }
    
    if (entry.entryType === 'paint') {
      console.log(`${entry.name}:`, entry.startTime)
    }
  }
})

observer.observe({ entryTypes: ['navigation', 'paint'] })

// Error tracking
window.addEventListener('error', (event) => {
  console.error('JavaScript Error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  })
})
```

### 2. Monitoring Backend

```javascript
// Middleware de monitoring
const monitoringMiddleware = (req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    })
  })
  
  next()
}

app.use(monitoringMiddleware)
```

### 3. Health Check Endpoint

```javascript
// routes/health.js
router.get('/health', async (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    checks: {
      database: 'OK',
      memory: 'OK',
      disk: 'OK'
    }
  }

  try {
    // Test de connexion DB
    await query('SELECT 1')
    
    // Vérification mémoire
    const memUsage = process.memoryUsage()
    if (memUsage.heapUsed / memUsage.heapTotal > 0.9) {
      healthCheck.checks.memory = 'WARNING'
    }
    
    res.status(200).json(healthCheck)
  } catch (error) {
    healthCheck.message = 'ERROR'
    healthCheck.checks.database = 'ERROR'
    res.status(503).json(healthCheck)
  }
})
```

## 🔧 Outils de Performance

### 1. Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.8.x
          lhci autorun
```

### 2. Bundle Analyzer

```bash
# Analyse du bundle
npm install --save-dev webpack-bundle-analyzer
npm run build -- --analyze
```

### 3. Performance Budget

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }
    }
  },
  // Budget de performance
  performance: {
    maxAssetSize: 250000,
    maxEntrypointSize: 250000,
    hints: 'warning'
  }
})
```

## 📈 Optimisations Avancées

### 1. Server-Side Rendering (SSR)

```javascript
// Pour les pages critiques
import { renderToString } from 'react-dom/server'

app.get('/dashboard', (req, res) => {
  const html = renderToString(<Dashboard />)
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Dashboard</title></head>
      <body>
        <div id="root">${html}</div>
        <script src="/static/js/main.js"></script>
      </body>
    </html>
  `)
})
```

### 2. Edge Caching avec CDN

```javascript
// Headers de cache optimisés
app.use('/static', express.static('public', {
  maxAge: '1y',
  etag: false,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache')
    }
  }
}))
```

### 3. Database Query Optimization

```javascript
// Requêtes optimisées avec jointures
const getStudentDashboard = async (studentId) => {
  const query = `
    SELECT 
      s.id, s.first_name, s.last_name,
      AVG(g.grade_value) as average_grade,
      COUNT(DISTINCT g.id) as total_grades,
      COUNT(DISTINCT a.id) as total_absences,
      COUNT(DISTINCT CASE WHEN m.is_read = false THEN m.id END) as unread_messages
    FROM students s
    LEFT JOIN grades g ON s.id = g.student_id
    LEFT JOIN absences a ON s.id = a.student_id
    LEFT JOIN messages m ON s.user_id = m.recipient_id
    WHERE s.id = $1
    GROUP BY s.id, s.first_name, s.last_name
  `
  
  return await db.query(query, [studentId])
}
```

## 🎯 Checklist d'Optimisation

### Frontend
- [ ] Code splitting implémenté
- [ ] Lazy loading des composants
- [ ] Images optimisées (WebP, AVIF)
- [ ] Service Worker configuré
- [ ] Bundle size < 250KB (gzipped)
- [ ] Lighthouse score > 90

### Backend
- [ ] Index de base de données optimisés
- [ ] Cache Redis implémenté
- [ ] Connection pooling configuré
- [ ] Compression activée
- [ ] Monitoring en place

### Infrastructure
- [ ] CDN configuré
- [ ] Gzip/Brotli activé
- [ ] HTTP/2 activé
- [ ] Cache headers optimisés
- [ ] Load balancer configuré

---

**Objectif**: Maintenir des performances optimales pour une expérience utilisateur fluide, même avec une connexion 3G.
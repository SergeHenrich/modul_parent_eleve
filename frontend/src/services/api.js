import axios from 'axios'
import toast from 'react-hot-toast'

// Configuration de base d'Axios
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Instance Axios principale
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur de requête pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur de réponse pour gérer les erreurs globales
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      const errorCode = error.response.data?.code
      
      if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN') {
        localStorage.removeItem('token')
        window.location.href = '/login'
        toast.error('Session expirée, veuillez vous reconnecter')
      }
    }
    
    // Gestion des erreurs de réseau
    if (!error.response) {
      toast.error('Erreur de connexion au serveur')
    }
    
    return Promise.reject(error)
  }
)

// Services d'authentification
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  verify: () => api.get('/auth/verify'),
  changePassword: (passwords) => api.put('/auth/change-password', passwords),
}

// Services des élèves
export const studentsAPI = {
  getAll: () => api.get('/students'),
  getById: (id) => api.get(`/students/${id}`),
  getByParent: (parentId) => api.get(`/students/parent/${parentId}`),
}

// Services des notes
export const gradesAPI = {
  getByStudent: (studentId, params = {}) => api.get(`/grades/student/${studentId}`, { params }),
  getByTrimester: (studentId, trimester) => api.get(`/grades/student/${studentId}/trimester/${trimester}`),
  getStatistics: (studentId) => api.get(`/grades/student/${studentId}/statistics`),
}

// Services des absences
export const absencesAPI = {
  getByStudent: (studentId, params = {}) => api.get(`/absences/student/${studentId}`, { params }),
  getStatistics: (studentId) => api.get(`/absences/student/${studentId}/statistics`),
  justify: (absenceId, justification) => api.put(`/absences/${absenceId}/justify`, justification),
}

// Services des messages
export const messagesAPI = {
  getAll: (params = {}) => api.get('/messages', { params }),
  getById: (id) => api.get(`/messages/${id}`),
  send: (message) => api.post('/messages', message),
  markAsRead: (id) => api.put(`/messages/${id}/read`),
  delete: (id) => api.delete(`/messages/${id}`),
  getConversation: (userId) => api.get(`/messages/conversation/${userId}`),
}

// Services des notifications
export const notificationsAPI = {
  getAll: (params = {}) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
}

// Services du profil utilisateur
export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  updateAvatar: (formData) => api.put('/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

// Services des statistiques du dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentGrades: (limit = 5) => api.get(`/dashboard/recent-grades?limit=${limit}`),
  getRecentAbsences: (limit = 5) => api.get(`/dashboard/recent-absences?limit=${limit}`),
  getUpcomingEvents: () => api.get('/dashboard/upcoming-events'),
}

// Service de santé de l'API
export const healthAPI = {
  check: () => api.get('/health'),
}

// Utilitaires pour les requêtes
export const apiUtils = {
  // Fonction pour gérer les erreurs de manière uniforme
  handleError: (error, defaultMessage = 'Une erreur est survenue') => {
    const message = error.response?.data?.error || error.message || defaultMessage
    toast.error(message)
    return { success: false, error: message }
  },

  // Fonction pour gérer les succès
  handleSuccess: (data, message) => {
    if (message) {
      toast.success(message)
    }
    return { success: true, data }
  },

  // Fonction pour formater les paramètres de requête
  formatParams: (params) => {
    const formatted = {}
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        formatted[key] = params[key]
      }
    })
    return formatted
  },

  // Fonction pour télécharger un fichier
  downloadFile: async (url, filename) => {
    try {
      const response = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      return { success: true }
    } catch (error) {
      return apiUtils.handleError(error, 'Erreur lors du téléchargement')
    }
  },
}

// Export de l'instance principale pour les cas spéciaux
export default api
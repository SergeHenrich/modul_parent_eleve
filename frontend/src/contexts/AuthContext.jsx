import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

// État initial
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: false,
}

// Actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  VERIFY_START: 'VERIFY_START',
  VERIFY_SUCCESS: 'VERIFY_SUCCESS',
  VERIFY_FAILURE: 'VERIFY_FAILURE',
  UPDATE_USER: 'UPDATE_USER',
}

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
      }
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      }
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
      }
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      }
    
    case AUTH_ACTIONS.VERIFY_START:
      return {
        ...state,
        isLoading: true,
      }
    
    case AUTH_ACTIONS.VERIFY_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
      }
    
    case AUTH_ACTIONS.VERIFY_FAILURE:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
      }
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      }
    
    default:
      return state
  }
}

// Contexte
const AuthContext = createContext()

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
}

// Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Fonction de connexion
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START })
      
      const response = await authAPI.login(credentials)
      const { token, user } = response.data
      
      // Stocker le token
      localStorage.setItem('token', token)
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { token, user }
      })
      
      toast.success(`Bienvenue ${user.firstName} !`)
      return { success: true }
      
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE })
      
      const errorMessage = error.response?.data?.error || 'Erreur de connexion'
      toast.error(errorMessage)
      
      return { 
        success: false, 
        error: errorMessage 
      }
    }
  }

  // Fonction de déconnexion
  const logout = async () => {
    try {
      // Appeler l'API de déconnexion si connecté
      if (state.token) {
        await authAPI.logout()
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    } finally {
      // Nettoyer le localStorage et l'état
      localStorage.removeItem('token')
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
      toast.success('Déconnexion réussie')
    }
  }

  // Fonction de vérification du token
  const verifyToken = async () => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      dispatch({ type: AUTH_ACTIONS.VERIFY_FAILURE })
      return
    }

    try {
      dispatch({ type: AUTH_ACTIONS.VERIFY_START })
      
      const response = await authAPI.verify()
      const { user } = response.data
      
      dispatch({
        type: AUTH_ACTIONS.VERIFY_SUCCESS,
        payload: { user }
      })
      
    } catch (error) {
      console.error('Erreur de vérification du token:', error)
      localStorage.removeItem('token')
      dispatch({ type: AUTH_ACTIONS.VERIFY_FAILURE })
    }
  }

  // Fonction de mise à jour du profil
  const updateUser = (userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData
    })
  }

  // Fonction de changement de mot de passe
  const changePassword = async (passwords) => {
    try {
      await authAPI.changePassword(passwords)
      toast.success('Mot de passe modifié avec succès')
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur lors du changement de mot de passe'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Vérifier le token au chargement de l'application
  useEffect(() => {
    verifyToken()
  }, [])

  // Valeurs du contexte
  const contextValue = {
    // État
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    
    // Actions
    login,
    logout,
    verifyToken,
    updateUser,
    changePassword,
    
    // Utilitaires
    isParent: state.user?.role === 'parent',
    isStudent: state.user?.role === 'eleve',
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
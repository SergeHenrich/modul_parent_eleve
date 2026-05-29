import React, { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Mail, Lock, GraduationCap } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../../components/UI/Button'
import FormInput from '../../components/UI/FormInput'
import Card from '../../components/UI/Card'
import Alert from '../../components/UI/Alert'

const Login = () => {
  const { login, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Rediriger si déjà connecté
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide'
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await login(formData)
      
      if (!result.success) {
        setLoginError(result.error)
      }
    } catch (error) {
      setLoginError('Une erreur inattendue s\'est produite')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Comptes de démonstration
  const demoAccounts = [
    { email: 'parent@edusmart.cm', password: 'password123', role: 'Parent' },
    { email: 'eleve@edusmart.cm', password: 'password123', role: 'Élève' }
  ]

  const fillDemoAccount = (account) => {
    setFormData({
      email: account.email,
      password: account.password
    })
    setErrors({})
    setLoginError('')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            EDUSMART-CM
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Portail Parent/Élève - Connectez-vous à votre compte
          </p>
        </div>

        {/* Formulaire de connexion */}
        <Card className="mt-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {loginError && (
              <Alert variant="danger" dismissible onDismiss={() => setLoginError('')}>
                {loginError}
              </Alert>
            )}

            <FormInput
              label="Adresse email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              icon={Mail}
              placeholder="votre.email@exemple.com"
              required
            />

            <FormInput
              label="Mot de passe"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              icon={Lock}
              placeholder="Votre mot de passe"
              showPasswordToggle
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </Card>

        {/* Comptes de démonstration */}
        <Card className="mt-6">
          <Card.Header>
            <Card.Title className="text-center text-sm">
              Comptes de démonstration
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-2">
              {demoAccounts.map((account, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                  onClick={() => fillDemoAccount(account)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {account.role}
                      </p>
                      <p className="text-xs text-gray-500">
                        {account.email}
                      </p>
                    </div>
                    <span className="text-xs text-primary-600 font-medium">
                      Utiliser
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Card.Content>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>© 2024 NEXATEC SOLUTIONS SARL</p>
          <p>Développé pour le MINESEC - Cameroun</p>
        </div>
      </div>
    </div>
  )
}

export default Login
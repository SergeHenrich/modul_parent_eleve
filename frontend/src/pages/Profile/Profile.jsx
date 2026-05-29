import React, { useState } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Save,
  Edit,
  Camera,
  Shield,
  Bell,
  Eye,
  EyeOff
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import FormInput from '../../components/UI/FormInput'
import Badge from '../../components/UI/Badge'
import Alert from '../../components/UI/Alert'

const Profile = () => {
  const { user, updateUser, changePassword } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Données du profil
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  })

  // Données de changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Préférences de notification
  const [notifications, setNotifications] = useState({
    emailGrades: true,
    emailAbsences: true,
    emailMessages: true,
    smsUrgent: false,
    smsAbsences: true
  })

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      // Simuler l'API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      updateUser(profileData)
      setIsEditing(false)
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du profil' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' })
      setSaving(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' })
      setSaving(false)
      return
    }

    try {
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })

      if (result.success) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setMessage({ type: 'success', text: 'Mot de passe modifié avec succès' })
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors du changement de mot de passe' })
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ]

  const ProfileTab = () => (
    <div className="space-y-6">
      {/* Photo de profil */}
      <Card>
        <Card.Header>
          <Card.Title>Photo de profil</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-primary-600" />
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                {user?.role}
              </p>
              <Badge variant="success" size="sm" className="mt-1">
                Compte actif
              </Badge>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Informations personnelles */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>Informations personnelles</Card.Title>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="w-4 h-4 mr-2" />
              {isEditing ? 'Annuler' : 'Modifier'}
            </Button>
          </div>
        </Card.Header>
        <Card.Content>
          <form onSubmit={handleProfileSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Prénom"
                type="text"
                value={profileData.firstName}
                onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                disabled={!isEditing}
                required
              />

              <FormInput
                label="Nom"
                type="text"
                value={profileData.lastName}
                onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                disabled={!isEditing}
                required
              />

              <FormInput
                label="Email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                disabled={!isEditing}
                icon={Mail}
                required
              />

              <FormInput
                label="Téléphone"
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                disabled={!isEditing}
                icon={Phone}
                placeholder="+237 6XX XXX XXX"
              />
            </div>

            <div className="mt-6">
              <FormInput
                label="Adresse"
                type="text"
                value={profileData.address}
                onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                disabled={!isEditing}
                icon={MapPin}
                placeholder="Votre adresse complète"
              />
            </div>

            {isEditing && (
              <div className="mt-6 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            )}
          </form>
        </Card.Content>
      </Card>
    </div>
  )

  const SecurityTab = () => (
    <div className="space-y-6">
      {/* Changement de mot de passe */}
      <Card>
        <Card.Header>
          <Card.Title>Changer le mot de passe</Card.Title>
          <Card.Description>
            Assurez-vous d'utiliser un mot de passe fort et unique
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <FormInput
              label="Mot de passe actuel"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              icon={Lock}
              showPasswordToggle
              required
            />

            <FormInput
              label="Nouveau mot de passe"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              icon={Lock}
              showPasswordToggle
              helperText="Au moins 6 caractères"
              required
            />

            <FormInput
              label="Confirmer le nouveau mot de passe"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              icon={Lock}
              showPasswordToggle
              required
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                Changer le mot de passe
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>

      {/* Sécurité du compte */}
      <Card>
        <Card.Header>
          <Card.Title>Sécurité du compte</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-success-50 rounded-lg">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-success-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-success-900">
                    Compte sécurisé
                  </p>
                  <p className="text-xs text-success-700">
                    Dernière connexion: Aujourd'hui à 14:30
                  </p>
                </div>
              </div>
              <Badge variant="success">Actif</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Authentification à deux facteurs
                </h4>
                <p className="text-xs text-gray-500 mb-3">
                  Ajoutez une couche de sécurité supplémentaire
                </p>
                <Button variant="outline" size="sm" disabled>
                  Bientôt disponible
                </Button>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Sessions actives
                </h4>
                <p className="text-xs text-gray-500 mb-3">
                  Gérez vos sessions de connexion
                </p>
                <Button variant="outline" size="sm">
                  Voir les sessions
                </Button>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  )

  const NotificationsTab = () => (
    <Card>
      <Card.Header>
        <Card.Title>Préférences de notification</Card.Title>
        <Card.Description>
          Choisissez comment vous souhaitez être informé
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="space-y-6">
          {/* Notifications par email */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">
              Notifications par email
            </h4>
            <div className="space-y-3">
              {[
                { key: 'emailGrades', label: 'Nouvelles notes disponibles' },
                { key: 'emailAbsences', label: 'Nouvelles absences enregistrées' },
                { key: 'emailMessages', label: 'Nouveaux messages reçus' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <button
                    type="button"
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications[item.key] ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                    onClick={() => setNotifications(prev => ({
                      ...prev,
                      [item.key]: !prev[item.key]
                    }))}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications par SMS */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">
              Notifications par SMS
            </h4>
            <div className="space-y-3">
              {[
                { key: 'smsUrgent', label: 'Messages urgents uniquement' },
                { key: 'smsAbsences', label: 'Absences non justifiées' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <button
                    type="button"
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications[item.key] ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                    onClick={() => setNotifications(prev => ({
                      ...prev,
                      [item.key]: !prev[item.key]
                    }))}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="primary">
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder les préférences
            </Button>
          </div>
        </div>
      </Card.Content>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <User className="w-8 h-8 mr-3 text-primary-600" />
          Mon profil
        </h1>
        <p className="text-gray-600">
          Gérez vos informations personnelles et préférences
        </p>
      </div>

      {/* Messages d'alerte */}
      {message && (
        <Alert
          variant={message.type === 'success' ? 'success' : 'danger'}
          dismissible
          onDismiss={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Contenu des onglets */}
      <div>
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
      </div>
    </div>
  )
}

export default Profile
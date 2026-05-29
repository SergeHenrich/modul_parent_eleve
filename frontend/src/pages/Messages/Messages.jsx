import React, { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  Send, 
  Search, 
  Filter,
  Plus,
  Mail,
  MailOpen,
  Reply,
  Trash2,
  User
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import FormInput from '../../components/UI/FormInput'
import Badge, { MessageTypeBadge, StatusBadge } from '../../components/UI/Badge'
import { SectionLoader } from '../../components/UI/LoadingSpinner'

const Messages = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [filteredMessages, setFilteredMessages] = useState([])
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [showCompose, setShowCompose] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    type: 'all', // 'sent', 'received', 'all'
    status: 'all', // 'read', 'unread', 'all'
    messageType: 'all' // 'normal', 'urgent', 'info', 'all'
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadMessages()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [messages, filters, searchTerm])

  const loadMessages = async () => {
    try {
      setIsLoading(true)
      
      // Simuler des données pour la démonstration
      setTimeout(() => {
        const mockMessages = [
          {
            id: 1,
            subject: 'Réunion parents-professeurs',
            content: 'Bonjour, nous organisons une réunion parents-professeurs le vendredi 20 janvier à 18h. Votre présence est souhaitée pour discuter des résultats de votre enfant.',
            sender_name: 'M. Martin',
            sender_email: 'martin@college.edu',
            recipient_name: user?.firstName + ' ' + user?.lastName,
            is_read: false,
            message_type: 'info',
            created_at: '2024-01-15T10:30:00Z',
            direction: 'received'
          },
          {
            id: 2,
            subject: 'Absence de Marie',
            content: 'Bonjour, je vous informe que ma fille Marie sera absente demain pour un rendez-vous médical. Merci de votre compréhension.',
            sender_name: user?.firstName + ' ' + user?.lastName,
            sender_email: user?.email,
            recipient_name: 'Mme. Dubois',
            is_read: true,
            message_type: 'normal',
            created_at: '2024-01-14T14:20:00Z',
            direction: 'sent'
          },
          {
            id: 3,
            subject: 'URGENT: Retard important',
            content: 'Votre enfant Paul accumule des retards répétés. Nous devons nous rencontrer rapidement pour trouver une solution.',
            sender_name: 'Mme. Leblanc',
            sender_email: 'leblanc@college.edu',
            recipient_name: user?.firstName + ' ' + user?.lastName,
            is_read: true,
            message_type: 'urgent',
            created_at: '2024-01-13T16:45:00Z',
            direction: 'received'
          }
        ]
        
        setMessages(mockMessages)
        setIsLoading(false)
      }, 1000)
      
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error)
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...messages]

    // Filtre par type (envoyé/reçu)
    if (filters.type !== 'all') {
      filtered = filtered.filter(message => message.direction === filters.type)
    }

    // Filtre par statut de lecture
    if (filters.status !== 'all') {
      filtered = filtered.filter(message => 
        message.is_read === (filters.status === 'read')
      )
    }

    // Filtre par type de message
    if (filters.messageType !== 'all') {
      filtered = filtered.filter(message => message.message_type === filters.messageType)
    }

    // Recherche textuelle
    if (searchTerm) {
      filtered = filtered.filter(message =>
        message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.sender_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredMessages(filtered)
  }

  const markAsRead = (messageId) => {
    setMessages(prev => prev.map(message =>
      message.id === messageId ? { ...message, is_read: true } : message
    ))
  }

  const deleteMessage = (messageId) => {
    setMessages(prev => prev.filter(message => message.id !== messageId))
    if (selectedMessage?.id === messageId) {
      setSelectedMessage(null)
    }
  }

  if (isLoading) {
    return <SectionLoader text="Chargement des messages..." />
  }

  const MessageItem = ({ message }) => (
    <div
      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
        !message.is_read ? 'bg-blue-50' : ''
      }`}
      onClick={() => {
        setSelectedMessage(message)
        if (!message.is_read) {
          markAsRead(message.id)
        }
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <div className="flex items-center">
              {message.is_read ? (
                <MailOpen className="w-4 h-4 text-gray-400" />
              ) : (
                <Mail className="w-4 h-4 text-primary-600" />
              )}
            </div>
            <p className={`text-sm font-medium truncate ${
              !message.is_read ? 'text-gray-900' : 'text-gray-600'
            }`}>
              {message.direction === 'sent' ? `À: ${message.recipient_name}` : `De: ${message.sender_name}`}
            </p>
            <MessageTypeBadge type={message.message_type} />
          </div>
          <h3 className={`text-sm font-medium truncate ${
            !message.is_read ? 'text-gray-900' : 'text-gray-700'
          }`}>
            {message.subject}
          </h3>
          <p className="text-sm text-gray-500 truncate mt-1">
            {message.content}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 text-right">
          <p className="text-xs text-gray-400">
            {new Date(message.created_at).toLocaleDateString('fr-FR')}
          </p>
          {!message.is_read && (
            <div className="w-2 h-2 bg-primary-600 rounded-full mt-1 ml-auto"></div>
          )}
        </div>
      </div>
    </div>
  )

  const MessageDetail = ({ message, onClose, onReply, onDelete }) => {
    if (!message) return null

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              ← Retour
            </Button>
            <MessageTypeBadge type={message.message_type} />
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => onReply(message)}>
              <Reply className="w-4 h-4 mr-1" />
              Répondre
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(message.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {message.subject}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {message.direction === 'sent' 
                  ? `À: ${message.recipient_name}` 
                  : `De: ${message.sender_name}`
                }
              </div>
              <span>•</span>
              <span>
                {new Date(message.created_at).toLocaleString('fr-FR')}
              </span>
            </div>
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const ComposeMessage = ({ onClose, onSend, replyTo = null }) => {
    const [formData, setFormData] = useState({
      recipient: replyTo?.sender_email || '',
      subject: replyTo ? `Re: ${replyTo.subject}` : '',
      content: '',
      messageType: 'normal'
    })

    const handleSubmit = (e) => {
      e.preventDefault()
      onSend(formData)
      onClose()
    }

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {replyTo ? 'Répondre au message' : 'Nouveau message'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="p-6 space-y-4">
            <FormInput
              label="Destinataire"
              type="email"
              value={formData.recipient}
              onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
              placeholder="email@exemple.com"
              required
            />

            <FormInput
              label="Sujet"
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Sujet du message"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de message
              </label>
              <select
                value={formData.messageType}
                onChange={(e) => setFormData(prev => ({ ...prev, messageType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="info">Information</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={8}
                placeholder="Tapez votre message ici..."
                required
              />
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary">
              <Send className="w-4 h-4 mr-2" />
              Envoyer
            </Button>
          </div>
        </form>
      </div>
    )
  }

  const unreadCount = messages.filter(m => !m.is_read).length

  return (
    <div className="h-screen flex flex-col">
      {/* En-tête */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <MessageSquare className="w-8 h-8 mr-3 text-primary-600" />
              Messages
              {unreadCount > 0 && (
                <Badge variant="danger" size="sm" className="ml-2">
                  {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
                </Badge>
              )}
            </h1>
            <p className="text-gray-600">
              Communiquez avec l'équipe pédagogique
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button 
              variant="primary" 
              onClick={() => setShowCompose(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau message
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Liste des messages */}
        <div className="w-full lg:w-1/2 border-r border-gray-200 flex flex-col">
          {/* Filtres et recherche */}
          <div className="p-4 border-b border-gray-200 space-y-4">
            <FormInput
              type="text"
              placeholder="Rechercher dans les messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />

            <div className="grid grid-cols-3 gap-2">
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="all">Tous</option>
                <option value="received">Reçus</option>
                <option value="sent">Envoyés</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="all">Tous</option>
                <option value="unread">Non lus</option>
                <option value="read">Lus</option>
              </select>

              <select
                value={filters.messageType}
                onChange={(e) => setFilters(prev => ({ ...prev, messageType: e.target.value }))}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="all">Tous types</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>

          {/* Liste */}
          <div className="flex-1 overflow-y-auto">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((message) => (
                <MessageItem key={message.id} message={message} />
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun message trouvé</p>
              </div>
            )}
          </div>
        </div>

        {/* Détail du message ou composition */}
        <div className="hidden lg:block lg:w-1/2">
          {showCompose ? (
            <ComposeMessage
              onClose={() => setShowCompose(false)}
              onSend={(data) => console.log('Sending message:', data)}
            />
          ) : selectedMessage ? (
            <MessageDetail
              message={selectedMessage}
              onClose={() => setSelectedMessage(null)}
              onReply={(message) => {
                setSelectedMessage(null)
                setShowCompose(true)
              }}
              onDelete={deleteMessage}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Sélectionnez un message pour le lire</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Messages
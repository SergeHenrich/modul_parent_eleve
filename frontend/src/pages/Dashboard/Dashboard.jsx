import React, { useState, useEffect } from 'react'
import { 
  Users, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/UI/Card'
import Badge from '../../components/UI/Badge'
import { SectionLoader } from '../../components/UI/LoadingSpinner'
import { dashboardAPI } from '../../services/api'

const Dashboard = () => {
  const { user, isParent, isStudent } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentGrades, setRecentGrades] = useState([])
  const [recentAbsences, setRecentAbsences] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Simuler des données pour la démonstration
      setTimeout(() => {
        setStats({
          totalStudents: isParent ? user?.children?.length || 2 : 1,
          averageGrade: 14.5,
          totalAbsences: 3,
          unreadMessages: 2
        })
        
        setRecentGrades([
          { id: 1, subject: 'Mathématiques', grade: 16.5, date: '2024-01-15', student: 'Marie Dupont' },
          { id: 2, subject: 'Français', grade: 14.0, date: '2024-01-14', student: 'Marie Dupont' },
          { id: 3, subject: 'Anglais', grade: 15.5, date: '2024-01-13', student: 'Paul Dupont' },
        ])
        
        setRecentAbsences([
          { id: 1, date: '2024-01-12', period: 'Matin', isJustified: false, student: 'Marie Dupont' },
          { id: 2, date: '2024-01-10', period: 'Après-midi', isJustified: true, student: 'Paul Dupont' },
        ])
        
        setIsLoading(false)
      }, 1000)
      
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <SectionLoader text="Chargement du tableau de bord..." />
  }

  // Cartes de statistiques
  const StatCard = ({ title, value, icon: Icon, color = 'primary', trend = null }) => (
    <Card className="relative overflow-hidden">
      <Card.Content className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
              <Icon className={`w-6 h-6 text-${color}-600`} />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <div className="flex items-center">
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
              {trend && (
                <span className={`ml-2 text-sm ${trend > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  <TrendingUp className="w-4 h-4 inline" />
                  {Math.abs(trend)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Tableau de bord
        </h1>
        <p className="text-gray-600">
          Bienvenue {user?.firstName}, voici un aperçu de votre activité
        </p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isParent && (
          <StatCard
            title="Enfants"
            value={stats?.totalStudents || 0}
            icon={Users}
            color="primary"
          />
        )}
        
        <StatCard
          title="Moyenne générale"
          value={`${stats?.averageGrade || 0}/20`}
          icon={BookOpen}
          color="success"
          trend={2.5}
        />
        
        <StatCard
          title="Absences ce mois"
          value={stats?.totalAbsences || 0}
          icon={Calendar}
          color="warning"
        />
        
        <StatCard
          title="Messages non lus"
          value={stats?.unreadMessages || 0}
          icon={MessageSquare}
          color="danger"
        />
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes récentes */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-primary-600" />
              Notes récentes
            </Card.Title>
          </Card.Header>
          <Card.Content>
            {recentGrades.length > 0 ? (
              <div className="space-y-4">
                {recentGrades.map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{grade.subject}</p>
                      {isParent && (
                        <p className="text-sm text-gray-500">{grade.student}</p>
                      )}
                      <p className="text-xs text-gray-400">{grade.date}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={grade.grade >= 15 ? 'success' : grade.grade >= 12 ? 'warning' : 'danger'}>
                        {grade.grade}/20
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune note récente</p>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Absences récentes */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-warning-600" />
              Absences récentes
            </Card.Title>
          </Card.Header>
          <Card.Content>
            {recentAbsences.length > 0 ? (
              <div className="space-y-4">
                {recentAbsences.map((absence) => (
                  <div key={absence.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center">
                        {absence.isJustified ? (
                          <CheckCircle className="w-4 h-4 text-success-500 mr-2" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-danger-500 mr-2" />
                        )}
                        <p className="font-medium text-gray-900">{absence.date}</p>
                      </div>
                      {isParent && (
                        <p className="text-sm text-gray-500">{absence.student}</p>
                      )}
                      <p className="text-xs text-gray-400">{absence.period}</p>
                    </div>
                    <Badge variant={absence.isJustified ? 'success' : 'danger'}>
                      {absence.isJustified ? 'Justifiée' : 'Non justifiée'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune absence récente</p>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <Card.Header>
          <Card.Title>Actions rapides</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
              <BookOpen className="w-8 h-8 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-primary-900">Voir les notes</span>
            </button>
            
            <button className="flex flex-col items-center p-4 bg-warning-50 rounded-lg hover:bg-warning-100 transition-colors">
              <Calendar className="w-8 h-8 text-warning-600 mb-2" />
              <span className="text-sm font-medium text-warning-900">Absences</span>
            </button>
            
            <button className="flex flex-col items-center p-4 bg-success-50 rounded-lg hover:bg-success-100 transition-colors">
              <MessageSquare className="w-8 h-8 text-success-600 mb-2" />
              <span className="text-sm font-medium text-success-900">Messages</span>
            </button>
            
            <button className="flex flex-col items-center p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors">
              <Users className="w-8 h-8 text-secondary-600 mb-2" />
              <span className="text-sm font-medium text-secondary-900">Profil</span>
            </button>
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}

export default Dashboard
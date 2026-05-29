import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Filter, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  FileText,
  User,
  Download
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import Badge, { AbsenceBadge } from '../../components/UI/Badge'
import { SectionLoader } from '../../components/UI/LoadingSpinner'
import Alert from '../../components/UI/Alert'

const Absences = () => {
  const { user, isParent, isStudent } = useAuth()
  const [absences, setAbsences] = useState([])
  const [filteredAbsences, setFilteredAbsences] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [filters, setFilters] = useState({
    month: 'all',
    year: new Date().getFullYear().toString(),
    justified: 'all',
    student: 'all'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAbsence, setSelectedAbsence] = useState(null)
  const [justificationModal, setJustificationModal] = useState(false)

  useEffect(() => {
    loadAbsences()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [absences, filters])

  const loadAbsences = async () => {
    try {
      setIsLoading(true)
      
      // Simuler des données pour la démonstration
      setTimeout(() => {
        const mockAbsences = [
          {
            id: 1,
            absence_date: '2024-01-15',
            period: 'Matin',
            is_justified: false,
            justification_reason: null,
            student_name: 'Marie Dupont',
            class_name: '6ème A',
            recorded_by: 'M. Martin'
          },
          {
            id: 2,
            absence_date: '2024-01-12',
            period: 'Après-midi',
            is_justified: true,
            justification_reason: 'Rendez-vous médical',
            student_name: 'Paul Dupont',
            class_name: '4ème B',
            recorded_by: 'Mme. Dubois'
          },
          {
            id: 3,
            absence_date: '2024-01-10',
            period: 'Journée complète',
            is_justified: true,
            justification_reason: 'Maladie avec certificat médical',
            student_name: 'Marie Dupont',
            class_name: '6ème A',
            recorded_by: 'M. Martin'
          },
          {
            id: 4,
            absence_date: '2024-02-05',
            period: 'Matin',
            is_justified: false,
            justification_reason: null,
            student_name: 'Paul Dupont',
            class_name: '4ème B',
            recorded_by: 'Mme. Dubois'
          }
        ]
        
        setAbsences(mockAbsences)
        
        // Calculer les statistiques
        const stats = {
          totalAbsences: mockAbsences.length,
          justifiedAbsences: mockAbsences.filter(a => a.is_justified).length,
          unjustifiedAbsences: mockAbsences.filter(a => !a.is_justified).length,
          thisMonth: mockAbsences.filter(a => {
            const absenceDate = new Date(a.absence_date)
            const now = new Date()
            return absenceDate.getMonth() === now.getMonth() && 
                   absenceDate.getFullYear() === now.getFullYear()
          }).length
        }
        
        setStatistics(stats)
        setIsLoading(false)
      }, 1000)
      
    } catch (error) {
      console.error('Erreur lors du chargement des absences:', error)
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...absences]

    if (filters.month !== 'all') {
      filtered = filtered.filter(absence => {
        const absenceDate = new Date(absence.absence_date)
        return absenceDate.getMonth() === parseInt(filters.month) - 1
      })
    }

    if (filters.year !== 'all') {
      filtered = filtered.filter(absence => {
        const absenceDate = new Date(absence.absence_date)
        return absenceDate.getFullYear() === parseInt(filters.year)
      })
    }

    if (filters.justified !== 'all') {
      filtered = filtered.filter(absence => 
        absence.is_justified === (filters.justified === 'true')
      )
    }

    if (filters.student !== 'all') {
      filtered = filtered.filter(absence => absence.student_name === filters.student)
    }

    setFilteredAbsences(filtered)
  }

  const getUniqueStudents = () => {
    return [...new Set(absences.map(absence => absence.student_name))]
  }

  const handleJustifyAbsence = async (absenceId, justification) => {
    try {
      // Simuler l'API call
      console.log('Justifying absence:', absenceId, justification)
      
      // Mettre à jour localement
      setAbsences(prev => prev.map(absence => 
        absence.id === absenceId 
          ? { ...absence, is_justified: true, justification_reason: justification }
          : absence
      ))
      
      setJustificationModal(false)
      setSelectedAbsence(null)
    } catch (error) {
      console.error('Erreur lors de la justification:', error)
    }
  }

  if (isLoading) {
    return <SectionLoader text="Chargement des absences..." />
  }

  const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle = null }) => (
    <Card>
      <Card.Content className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
              <Icon className={`w-6 h-6 text-${color}-600`} />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>
      </Card.Content>
    </Card>
  )

  const AbsenceRow = ({ absence }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-sm font-medium text-gray-900">
            {new Date(absence.absence_date).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant="secondary" size="sm">
          {absence.period}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {absence.is_justified ? (
            <CheckCircle className="w-4 h-4 text-success-500 mr-2" />
          ) : (
            <AlertCircle className="w-4 h-4 text-danger-500 mr-2" />
          )}
          <AbsenceBadge isJustified={absence.is_justified} />
        </div>
      </td>
      {isParent && (
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <div>
            <div className="font-medium">{absence.student_name}</div>
            <div className="text-gray-500">{absence.class_name}</div>
          </div>
        </td>
      )}
      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
        {absence.justification_reason || (
          <span className="text-gray-400 italic">Non justifiée</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {absence.recorded_by}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {!absence.is_justified && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedAbsence(absence)
              setJustificationModal(true)
            }}
          >
            <FileText className="w-4 h-4 mr-1" />
            Justifier
          </Button>
        )}
      </td>
    </tr>
  )

  const JustificationModal = ({ absence, onClose, onSubmit }) => {
    const [justification, setJustification] = useState('')

    if (!absence) return null

    const handleSubmit = (e) => {
      e.preventDefault()
      if (justification.trim()) {
        onSubmit(absence.id, justification.trim())
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Justifier l'absence
            </h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Date:</strong> {new Date(absence.absence_date).toLocaleDateString('fr-FR')}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Période:</strong> {absence.period}
              </p>
              {isParent && (
                <p className="text-sm text-gray-600">
                  <strong>Élève:</strong> {absence.student_name}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motif de justification *
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={4}
                  placeholder="Expliquez le motif de l'absence..."
                  required
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={!justification.trim()}
                >
                  Justifier
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-8 h-8 mr-3 text-warning-600" />
            {isParent ? 'Absences des enfants' : 'Mes absences'}
          </h1>
          <p className="text-gray-600">
            Consultez et gérez les absences scolaires
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Alerte pour absences non justifiées */}
      {statistics && statistics.unjustifiedAbsences > 0 && (
        <Alert variant="warning" title="Absences non justifiées">
          Vous avez {statistics.unjustifiedAbsences} absence{statistics.unjustifiedAbsences > 1 ? 's' : ''} non justifiée{statistics.unjustifiedAbsences > 1 ? 's' : ''}. 
          Pensez à les justifier rapidement.
        </Alert>
      )}

      {/* Statistiques */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total absences"
            value={statistics.totalAbsences}
            icon={Calendar}
            color="primary"
          />
          <StatCard
            title="Justifiées"
            value={statistics.justifiedAbsences}
            icon={CheckCircle}
            color="success"
          />
          <StatCard
            title="Non justifiées"
            value={statistics.unjustifiedAbsences}
            icon={AlertCircle}
            color="danger"
          />
          <StatCard
            title="Ce mois-ci"
            value={statistics.thisMonth}
            icon={Clock}
            color="warning"
          />
        </div>
      )}

      {/* Filtres */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtres
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mois
              </label>
              <select
                value={filters.month}
                onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Tous les mois</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i).toLocaleDateString('fr-FR', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Année
              </label>
              <select
                value={filters.year}
                onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={filters.justified}
                onChange={(e) => setFilters(prev => ({ ...prev, justified: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Toutes</option>
                <option value="true">Justifiées</option>
                <option value="false">Non justifiées</option>
              </select>
            </div>

            {isParent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Élève
                </label>
                <select
                  value={filters.student}
                  onChange={(e) => setFilters(prev => ({ ...prev, student: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Tous les élèves</option>
                  {getUniqueStudents().map((student) => (
                    <option key={student} value={student}>
                      {student}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>

      {/* Tableau des absences */}
      <Card>
        <Card.Header>
          <Card.Title>
            Absences ({filteredAbsences.length})
          </Card.Title>
        </Card.Header>
        <Card.Content className="p-0">
          {filteredAbsences.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Période
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    {isParent && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Élève
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Justification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enregistré par
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAbsences.map((absence) => (
                    <AbsenceRow key={absence.id} absence={absence} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune absence trouvée
              </h3>
              <p className="text-gray-600">
                Aucune absence ne correspond aux filtres sélectionnés
              </p>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Modal de justification */}
      <JustificationModal
        absence={selectedAbsence}
        onClose={() => {
          setJustificationModal(false)
          setSelectedAbsence(null)
        }}
        onSubmit={handleJustifyAbsence}
      />
    </div>
  )
}

export default Absences
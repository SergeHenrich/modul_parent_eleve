import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Filter, 
  Download, 
  TrendingUp,
  Calendar,
  User,
  BarChart3
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import Badge, { GradeBadge } from '../../components/UI/Badge'
import { SectionLoader } from '../../components/UI/LoadingSpinner'

const Grades = () => {
  const { user, isParent, isStudent } = useAuth()
  const [grades, setGrades] = useState([])
  const [filteredGrades, setFilteredGrades] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [filters, setFilters] = useState({
    trimester: 'all',
    subject: 'all',
    student: 'all'
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadGrades()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [grades, filters])

  const loadGrades = async () => {
    try {
      setIsLoading(true)
      
      // Simuler des données pour la démonstration
      setTimeout(() => {
        const mockGrades = [
          {
            id: 1,
            subject_name: 'Mathématiques',
            subject_code: 'MATH',
            grade_value: 16.5,
            grade_type: 'Devoir',
            trimester: 1,
            coefficient: 4,
            date_recorded: '2024-01-15',
            teacher_comment: 'Très bon travail',
            student_name: 'Marie Dupont'
          },
          {
            id: 2,
            subject_name: 'Français',
            subject_code: 'FR',
            grade_value: 14.0,
            grade_type: 'Composition',
            trimester: 1,
            coefficient: 3,
            date_recorded: '2024-01-14',
            teacher_comment: 'Peut mieux faire',
            student_name: 'Marie Dupont'
          },
          {
            id: 3,
            subject_name: 'Anglais',
            subject_code: 'ANG',
            grade_value: 15.5,
            grade_type: 'Devoir',
            trimester: 1,
            coefficient: 2,
            date_recorded: '2024-01-13',
            teacher_comment: 'Bon niveau',
            student_name: 'Paul Dupont'
          },
          {
            id: 4,
            subject_name: 'Sciences Physiques',
            subject_code: 'PC',
            grade_value: 12.5,
            grade_type: 'Examen',
            trimester: 2,
            coefficient: 3,
            date_recorded: '2024-02-10',
            teacher_comment: 'Travail à améliorer',
            student_name: 'Marie Dupont'
          }
        ]
        
        setGrades(mockGrades)
        
        // Calculer les statistiques
        const stats = {
          totalGrades: mockGrades.length,
          averageGrade: mockGrades.reduce((sum, grade) => sum + grade.grade_value, 0) / mockGrades.length,
          bestGrade: Math.max(...mockGrades.map(g => g.grade_value)),
          worstGrade: Math.min(...mockGrades.map(g => g.grade_value)),
          byTrimester: {
            1: mockGrades.filter(g => g.trimester === 1).length,
            2: mockGrades.filter(g => g.trimester === 2).length,
            3: mockGrades.filter(g => g.trimester === 3).length
          }
        }
        
        setStatistics(stats)
        setIsLoading(false)
      }, 1000)
      
    } catch (error) {
      console.error('Erreur lors du chargement des notes:', error)
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...grades]

    if (filters.trimester !== 'all') {
      filtered = filtered.filter(grade => grade.trimester === parseInt(filters.trimester))
    }

    if (filters.subject !== 'all') {
      filtered = filtered.filter(grade => grade.subject_code === filters.subject)
    }

    if (filters.student !== 'all') {
      filtered = filtered.filter(grade => grade.student_name === filters.student)
    }

    setFilteredGrades(filtered)
  }

  const getUniqueSubjects = () => {
    const subjects = [...new Set(grades.map(grade => ({ 
      code: grade.subject_code, 
      name: grade.subject_name 
    })))]
    return subjects
  }

  const getUniqueStudents = () => {
    return [...new Set(grades.map(grade => grade.student_name))]
  }

  if (isLoading) {
    return <SectionLoader text="Chargement des notes..." />
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

  const GradeRow = ({ grade }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">
            {grade.subject_name}
          </div>
          <div className="text-sm text-gray-500">
            {grade.subject_code}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <GradeBadge grade={grade.grade_value} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {grade.grade_type}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant="secondary" size="sm">
          T{grade.trimester}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {grade.date_recorded}
      </td>
      {isParent && (
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {grade.student_name}
        </td>
      )}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        Coef. {grade.coefficient}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
        {grade.teacher_comment}
      </td>
    </tr>
  )

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BookOpen className="w-8 h-8 mr-3 text-primary-600" />
            {isParent ? 'Notes des enfants' : 'Mes notes'}
          </h1>
          <p className="text-gray-600">
            Consultez et analysez les résultats scolaires
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Graphiques
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total des notes"
            value={statistics.totalGrades}
            icon={BookOpen}
            color="primary"
          />
          <StatCard
            title="Moyenne générale"
            value={`${statistics.averageGrade.toFixed(1)}/20`}
            icon={TrendingUp}
            color="success"
          />
          <StatCard
            title="Meilleure note"
            value={`${statistics.bestGrade}/20`}
            icon={TrendingUp}
            color="success"
          />
          <StatCard
            title="Note la plus faible"
            value={`${statistics.worstGrade}/20`}
            icon={TrendingUp}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trimestre
              </label>
              <select
                value={filters.trimester}
                onChange={(e) => setFilters(prev => ({ ...prev, trimester: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Tous les trimestres</option>
                <option value="1">1er Trimestre</option>
                <option value="2">2ème Trimestre</option>
                <option value="3">3ème Trimestre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matière
              </label>
              <select
                value={filters.subject}
                onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Toutes les matières</option>
                {getUniqueSubjects().map((subject) => (
                  <option key={subject.code} value={subject.code}>
                    {subject.name}
                  </option>
                ))}
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

      {/* Tableau des notes */}
      <Card>
        <Card.Header>
          <Card.Title>
            Notes ({filteredGrades.length})
          </Card.Title>
        </Card.Header>
        <Card.Content className="p-0">
          {filteredGrades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Matière
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Note
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trimestre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    {isParent && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Élève
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coefficient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commentaire
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGrades.map((grade) => (
                    <GradeRow key={grade.id} grade={grade} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune note trouvée
              </h3>
              <p className="text-gray-600">
                Aucune note ne correspond aux filtres sélectionnés
              </p>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  )
}

export default Grades
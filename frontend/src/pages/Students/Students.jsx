import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Search, 
  BookOpen, 
  Calendar, 
  Mail,
  User,
  GraduationCap
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import FormInput from '../../components/UI/FormInput'
import Badge from '../../components/UI/Badge'
import { SectionLoader } from '../../components/UI/LoadingSpinner'

const Students = () => {
  const { user, isParent } = useAuth()
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState(null)

  useEffect(() => {
    loadStudents()
  }, [])

  useEffect(() => {
    // Filtrer les élèves selon le terme de recherche
    const filtered = students.filter(student =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.className.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredStudents(filtered)
  }, [students, searchTerm])

  const loadStudents = async () => {
    try {
      setIsLoading(true)
      
      // Simuler des données pour la démonstration
      setTimeout(() => {
        const mockStudents = [
          {
            id: 1,
            firstName: 'Marie',
            lastName: 'Dupont',
            email: 'marie.dupont@edusmart.cm',
            studentNumber: 'STU001',
            className: '6ème A',
            academicYear: '2023-2024',
            birthDate: '2010-05-15',
            gender: 'F',
            statistics: {
              totalGrades: 24,
              averageGrade: 14.5,
              totalAbsences: 2,
              unjustifiedAbsences: 0
            }
          },
          {
            id: 2,
            firstName: 'Paul',
            lastName: 'Dupont',
            email: 'paul.dupont@edusmart.cm',
            studentNumber: 'STU002',
            className: '4ème B',
            academicYear: '2023-2024',
            birthDate: '2008-09-22',
            gender: 'M',
            statistics: {
              totalGrades: 28,
              averageGrade: 16.2,
              totalAbsences: 1,
              unjustifiedAbsences: 1
            }
          }
        ]
        
        setStudents(mockStudents)
        setIsLoading(false)
      }, 1000)
      
    } catch (error) {
      console.error('Erreur lors du chargement des élèves:', error)
      setIsLoading(false)
    }
  }

  if (!isParent) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Accès non autorisé
        </h2>
        <p className="text-gray-600">
          Cette page est réservée aux parents.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return <SectionLoader text="Chargement des élèves..." />
  }

  const StudentCard = ({ student }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
          onClick={() => setSelectedStudent(student)}>
      <Card.Content className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {student.firstName} {student.lastName}
              </h3>
              <p className="text-sm text-gray-500">
                {student.studentNumber} • {student.className}
              </p>
              <p className="text-xs text-gray-400">
                Année scolaire: {student.academicYear}
              </p>
            </div>
          </div>
          <Badge variant="primary" size="sm">
            {student.className}
          </Badge>
        </div>

        {/* Statistiques rapides */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-success-50 rounded-lg">
            <p className="text-lg font-semibold text-success-900">
              {student.statistics.averageGrade}/20
            </p>
            <p className="text-xs text-success-600">Moyenne</p>
          </div>
          <div className="text-center p-3 bg-warning-50 rounded-lg">
            <p className="text-lg font-semibold text-warning-900">
              {student.statistics.totalAbsences}
            </p>
            <p className="text-xs text-warning-600">Absences</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex space-x-2">
          <Button size="sm" variant="outline" className="flex-1">
            <BookOpen className="w-4 h-4 mr-1" />
            Notes
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Calendar className="w-4 h-4 mr-1" />
            Absences
          </Button>
          <Button size="sm" variant="outline">
            <Mail className="w-4 h-4" />
          </Button>
        </div>
      </Card.Content>
    </Card>
  )

  const StudentDetailModal = ({ student, onClose }) => {
    if (!student) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Profil de {student.firstName} {student.lastName}
              </h2>
              <Button variant="ghost" onClick={onClose}>
                ×
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations personnelles */}
              <Card>
                <Card.Header>
                  <Card.Title>Informations personnelles</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Numéro d'élève</label>
                      <p className="text-gray-900">{student.studentNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Classe</label>
                      <p className="text-gray-900">{student.className}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date de naissance</label>
                      <p className="text-gray-900">{student.birthDate}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{student.email}</p>
                    </div>
                  </div>
                </Card.Content>
              </Card>

              {/* Statistiques académiques */}
              <Card>
                <Card.Header>
                  <Card.Title>Statistiques académiques</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Nombre de notes</span>
                      <span className="font-semibold">{student.statistics.totalGrades}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Moyenne générale</span>
                      <Badge variant="success">{student.statistics.averageGrade}/20</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total absences</span>
                      <span className="font-semibold">{student.statistics.totalAbsences}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Absences non justifiées</span>
                      <Badge variant={student.statistics.unjustifiedAbsences > 0 ? 'danger' : 'success'}>
                        {student.statistics.unjustifiedAbsences}
                      </Badge>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </div>

            {/* Actions */}
            <div className="mt-6 flex space-x-4">
              <Button variant="primary" className="flex-1">
                <BookOpen className="w-4 h-4 mr-2" />
                Voir les notes
              </Button>
              <Button variant="secondary" className="flex-1">
                <Calendar className="w-4 h-4 mr-2" />
                Voir les absences
              </Button>
              <Button variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Envoyer un message
              </Button>
            </div>
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
            <Users className="w-8 h-8 mr-3 text-primary-600" />
            Mes enfants
          </h1>
          <p className="text-gray-600">
            Gérez et suivez la scolarité de vos enfants
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Badge variant="primary" size="lg">
            {students.length} élève{students.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Barre de recherche */}
      <Card>
        <Card.Content className="p-4">
          <FormInput
            type="text"
            placeholder="Rechercher par nom, numéro d'élève ou classe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
            className="w-full"
          />
        </Card.Content>
      </Card>

      {/* Liste des élèves */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      ) : (
        <Card>
          <Card.Content className="text-center py-12">
            <GraduationCap className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Aucun élève trouvé' : 'Aucun élève'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Essayez de modifier votre recherche'
                : 'Aucun élève n\'est associé à votre compte'
              }
            </p>
          </Card.Content>
        </Card>
      )}

      {/* Modal de détail */}
      <StudentDetailModal 
        student={selectedStudent} 
        onClose={() => setSelectedStudent(null)} 
      />
    </div>
  )
}

export default Students
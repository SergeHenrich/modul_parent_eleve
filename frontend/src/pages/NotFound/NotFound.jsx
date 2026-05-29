import React from 'react'
import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'
import Button from '../../components/UI/Button'
import Card from '../../components/UI/Card'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="text-center">
          <Card.Content className="p-8">
            {/* Illustration 404 */}
            <div className="mb-8">
              <div className="text-6xl font-bold text-primary-600 mb-2">404</div>
              <div className="w-24 h-1 bg-primary-600 mx-auto rounded-full"></div>
            </div>

            {/* Titre et description */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Page non trouvée
            </h1>
            <p className="text-gray-600 mb-8">
              Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
            </p>

            {/* Actions */}
            <div className="space-y-4">
              <Link to="/dashboard">
                <Button variant="primary" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Retour au tableau de bord
                </Button>
              </Link>
              
              <button 
                onClick={() => window.history.back()}
                className="w-full"
              >
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Page précédente
                </Button>
              </button>
            </div>

            {/* Liens utiles */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">
                Liens utiles :
              </p>
              <div className="space-y-2">
                <Link 
                  to="/grades" 
                  className="block text-sm text-primary-600 hover:text-primary-700"
                >
                  Consulter les notes
                </Link>
                <Link 
                  to="/absences" 
                  className="block text-sm text-primary-600 hover:text-primary-700"
                >
                  Voir les absences
                </Link>
                <Link 
                  to="/messages" 
                  className="block text-sm text-primary-600 hover:text-primary-700"
                >
                  Accéder aux messages
                </Link>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>© 2024 EDUSMART-CM - NEXATEC SOLUTIONS</p>
        </div>
      </div>
    </div>
  )
}

export default NotFound
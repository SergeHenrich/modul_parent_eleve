import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  Home, 
  Users, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  User,
  X,
  GraduationCap
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isParent, isStudent } = useAuth()
  const location = useLocation()

  // Navigation selon le rôle
  const getNavigation = () => {
    const baseNav = [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Messages', href: '/messages', icon: MessageSquare },
      { name: 'Profil', href: '/profile', icon: User },
    ]

    if (isParent) {
      return [
        ...baseNav.slice(0, 1), // Dashboard
        { name: 'Mes enfants', href: '/students', icon: Users },
        { name: 'Notes', href: '/grades', icon: BookOpen },
        { name: 'Absences', href: '/absences', icon: Calendar },
        ...baseNav.slice(1), // Messages et Profil
      ]
    }

    if (isStudent) {
      return [
        ...baseNav.slice(0, 1), // Dashboard
        { name: 'Mes notes', href: '/grades', icon: BookOpen },
        { name: 'Mes absences', href: '/absences', icon: Calendar },
        ...baseNav.slice(1), // Messages et Profil
      ]
    }

    return baseNav
  }

  const navigation = getNavigation()

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.href
    
    return (
      <NavLink
        to={item.href}
        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
          isActive
            ? 'bg-primary-100 text-primary-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        onClick={() => onClose && onClose()}
      >
        <item.icon
          className={`mr-3 flex-shrink-0 h-6 w-6 ${
            isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
          }`}
        />
        {item.name}
      </NavLink>
    )
  }

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 flex flex-col w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:static lg:inset-0`}>
        
        {/* Header du sidebar */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <GraduationCap className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">EDUSMART</h1>
              <p className="text-xs text-gray-500">Portail Éducatif</p>
            </div>
          </div>
          
          {/* Bouton fermer (mobile uniquement) */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Informations utilisateur */}
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role === 'parent' ? 'Parent' : 'Élève'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>

        {/* Footer du sidebar */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p>EDUSMART-CM v1.0.0</p>
            <p>© 2024 NEXATEC SOLUTIONS</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  Home, 
  Users, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  User
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const MobileNav = () => {
  const { isParent, isStudent } = useAuth()
  const location = useLocation()

  // Navigation selon le rôle (version simplifiée pour mobile)
  const getNavigation = () => {
    const baseNav = [
      { name: 'Accueil', href: '/dashboard', icon: Home },
      { name: 'Messages', href: '/messages', icon: MessageSquare },
      { name: 'Profil', href: '/profile', icon: User },
    ]

    if (isParent) {
      return [
        baseNav[0], // Accueil
        { name: 'Enfants', href: '/students', icon: Users },
        { name: 'Notes', href: '/grades', icon: BookOpen },
        { name: 'Absences', href: '/absences', icon: Calendar },
        baseNav[1], // Messages
      ]
    }

    if (isStudent) {
      return [
        baseNav[0], // Accueil
        { name: 'Notes', href: '/grades', icon: BookOpen },
        { name: 'Absences', href: '/absences', icon: Calendar },
        baseNav[1], // Messages
        baseNav[2], // Profil
      ]
    }

    return baseNav
  }

  const navigation = getNavigation()

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <nav className="flex">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`flex-1 flex flex-col items-center py-2 px-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <item.icon className={`h-6 w-6 mb-1 ${
                isActive ? 'text-primary-600' : 'text-gray-400'
              }`} />
              <span className="truncate">{item.name}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

export default MobileNav
import React from 'react'
import { Loader2 } from 'lucide-react'

const LoadingSpinner = ({ 
  size = 'md', 
  className = '', 
  text = '',
  fullScreen = false 
}) => {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }
  
  const spinner = (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={`${sizes[size]} animate-spin text-primary-600`} />
        {text && (
          <p className="text-sm text-gray-600 animate-pulse">{text}</p>
        )}
      </div>
    </div>
  )
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        {spinner}
      </div>
    )
  }
  
  return spinner
}

// Composant pour les états de chargement de page
export const PageLoader = ({ text = 'Chargement...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}

// Composant pour les états de chargement de section
export const SectionLoader = ({ text = 'Chargement...', className = '' }) => {
  return (
    <div className={`py-12 ${className}`}>
      <LoadingSpinner size="md" text={text} />
    </div>
  )
}

// Composant pour les boutons de chargement
export const ButtonLoader = ({ size = 'sm' }) => {
  return <Loader2 className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} />
}

export default LoadingSpinner
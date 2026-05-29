import React from 'react'

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full'
  
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
    secondary: 'bg-secondary-100 text-secondary-800',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    danger: 'bg-danger-100 text-danger-800',
    info: 'bg-blue-100 text-blue-800',
    
    // Variants avec bordure
    'outline-default': 'border border-gray-300 text-gray-700 bg-white',
    'outline-primary': 'border border-primary-300 text-primary-700 bg-white',
    'outline-success': 'border border-success-300 text-success-700 bg-white',
    'outline-warning': 'border border-warning-300 text-warning-700 bg-white',
    'outline-danger': 'border border-danger-300 text-danger-700 bg-white',
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  }
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`
  
  return (
    <span className={classes} {...props}>
      {children}
    </span>
  )
}

// Badges spécialisés pour l'application
export const GradeBadge = ({ grade, className = '' }) => {
  let variant = 'default'
  
  if (grade >= 16) variant = 'success'
  else if (grade >= 14) variant = 'primary'
  else if (grade >= 12) variant = 'warning'
  else if (grade >= 10) variant = 'secondary'
  else variant = 'danger'
  
  return (
    <Badge variant={variant} className={className}>
      {grade}/20
    </Badge>
  )
}

export const AbsenceBadge = ({ isJustified, className = '' }) => {
  return (
    <Badge 
      variant={isJustified ? 'success' : 'danger'} 
      className={className}
    >
      {isJustified ? 'Justifiée' : 'Non justifiée'}
    </Badge>
  )
}

export const MessageTypeBadge = ({ type, className = '' }) => {
  const variants = {
    normal: 'default',
    urgent: 'danger',
    info: 'info'
  }
  
  const labels = {
    normal: 'Normal',
    urgent: 'Urgent',
    info: 'Information'
  }
  
  return (
    <Badge variant={variants[type]} size="sm" className={className}>
      {labels[type]}
    </Badge>
  )
}

export const StatusBadge = ({ status, className = '' }) => {
  const config = {
    active: { variant: 'success', label: 'Actif' },
    inactive: { variant: 'secondary', label: 'Inactif' },
    pending: { variant: 'warning', label: 'En attente' },
    blocked: { variant: 'danger', label: 'Bloqué' },
    read: { variant: 'success', label: 'Lu' },
    unread: { variant: 'primary', label: 'Non lu' }
  }
  
  const { variant, label } = config[status] || config.inactive
  
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}

export default Badge
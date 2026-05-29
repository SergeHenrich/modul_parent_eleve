import React from 'react'
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react'

const Alert = ({ 
  children, 
  variant = 'info', 
  title,
  dismissible = false,
  onDismiss,
  className = '',
  ...props 
}) => {
  const variants = {
    success: {
      container: 'bg-success-50 border-success-200 text-success-800',
      icon: CheckCircle,
      iconColor: 'text-success-400'
    },
    warning: {
      container: 'bg-warning-50 border-warning-200 text-warning-800',
      icon: AlertTriangle,
      iconColor: 'text-warning-400'
    },
    danger: {
      container: 'bg-danger-50 border-danger-200 text-danger-800',
      icon: AlertCircle,
      iconColor: 'text-danger-400'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: Info,
      iconColor: 'text-blue-400'
    }
  }
  
  const { container, icon: Icon, iconColor } = variants[variant]
  
  const classes = `rounded-md border p-4 ${container} ${className}`
  
  return (
    <div className={classes} {...props}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          
          <div className={`text-sm ${title ? '' : 'mt-0'}`}>
            {children}
          </div>
        </div>
        
        {dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  variant === 'success' ? 'text-success-500 hover:bg-success-100 focus:ring-success-600' :
                  variant === 'warning' ? 'text-warning-500 hover:bg-warning-100 focus:ring-warning-600' :
                  variant === 'danger' ? 'text-danger-500 hover:bg-danger-100 focus:ring-danger-600' :
                  'text-blue-500 hover:bg-blue-100 focus:ring-blue-600'
                }`}
                onClick={onDismiss}
              >
                <span className="sr-only">Fermer</span>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Composants d'alerte spécialisés
export const SuccessAlert = ({ children, ...props }) => (
  <Alert variant="success" {...props}>{children}</Alert>
)

export const WarningAlert = ({ children, ...props }) => (
  <Alert variant="warning" {...props}>{children}</Alert>
)

export const DangerAlert = ({ children, ...props }) => (
  <Alert variant="danger" {...props}>{children}</Alert>
)

export const InfoAlert = ({ children, ...props }) => (
  <Alert variant="info" {...props}>{children}</Alert>
)

export default Alert
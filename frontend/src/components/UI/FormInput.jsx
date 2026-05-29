import React, { forwardRef } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

const FormInput = forwardRef(({
  label,
  type = 'text',
  error,
  helperText,
  required = false,
  className = '',
  containerClassName = '',
  showPasswordToggle = false,
  icon: Icon,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false)
  
  const inputType = type === 'password' && showPassword ? 'text' : type
  
  const inputClasses = `
    block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
    focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm
    ${error 
      ? 'border-danger-300 text-danger-900 focus:ring-danger-500 focus:border-danger-500' 
      : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
    }
    ${Icon ? 'pl-10' : ''}
    ${type === 'password' && showPasswordToggle ? 'pr-10' : ''}
    ${className}
  `
  
  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        <input
          ref={ref}
          type={inputType}
          className={inputClasses}
          {...props}
        />
        
        {type === 'password' && showPasswordToggle && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        )}
      </div>
      
      {error && (
        <div className="flex items-center space-x-1 text-sm text-danger-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
})

FormInput.displayName = 'FormInput'

export default FormInput
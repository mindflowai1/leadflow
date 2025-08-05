import React from 'react'

interface LogoImageProps {
  className?: string
  alt?: string
}

export const LogoImage: React.FC<LogoImageProps> = ({ className = '', alt = 'LeadFlow' }) => {
  return (
    <img 
      src="/lflogo1.png"
      alt={alt}
      className={className}
      onError={(e) => {
        // Fallback se a imagem não carregar
        const target = e.target as HTMLImageElement
        target.style.display = 'none'
        
        // Criar um span com texto como fallback
        const fallback = document.createElement('span')
        fallback.textContent = 'LeadFlow'
        fallback.className = 'text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
        
        if (target.parentNode) {
          target.parentNode.insertBefore(fallback, target)
        }
      }}
    />
  )
}

export default LogoImage
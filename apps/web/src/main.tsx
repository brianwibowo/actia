import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DirectionProvider } from '@/context/direction-provider'
import { FontProvider } from '@/context/font-provider'
import { ThemeProvider } from '@/context/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { App } from './App'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <FontProvider>
        <DirectionProvider>
          <App />
          <Toaster duration={4000} />
        </DirectionProvider>
      </FontProvider>
    </ThemeProvider>
  </StrictMode>
)

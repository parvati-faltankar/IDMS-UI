import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './theme/ThemeProvider.tsx'
import { MenuBuilderProvider } from './theme/MenuBuilderContext.tsx'
import { initializeTheme } from './theme/themeRegistry.ts'
import { initializeMenuBuilder } from './utils/menuInitialization.ts'
import { LocalizationProvider } from './localization'

initializeTheme()
initializeMenuBuilder()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <LocalizationProvider>
        <ThemeProvider>
          <MenuBuilderProvider>
            <App />
          </MenuBuilderProvider>
        </ThemeProvider>
      </LocalizationProvider>
    </HashRouter>
  </StrictMode>,
)

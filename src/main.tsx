import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Human friendly date formatting
Object.assign(Date.prototype, {
    friendlyFormatDate(this: Date) {
        const browserLang = navigator.language || 'en-US'
        const formatterOptions: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'long'
        }

        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Copenhagen'
        const formatter = new Intl.DateTimeFormat(browserLang, {
            timeZone,
            ...formatterOptions
        })
        return formatter.format(this)
    }
})



createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
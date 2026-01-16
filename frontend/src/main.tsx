import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { CurrencyProvider } from './context/CurrencyContext'
import ErrorBoundary from './components/ErrorBoundary'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <CurrencyProvider>
                    <ThemeProvider>
                        <AuthProvider>
                            <App />
                        </AuthProvider>
                    </ThemeProvider>
                </CurrencyProvider>
            </QueryClientProvider>
        </BrowserRouter>
    </ErrorBoundary>
)

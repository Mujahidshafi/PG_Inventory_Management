import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { supabase } from '../lib/supabaseClient'
import AuthGuard from '../components/AuthGuard'
import '../styles/globals.css'


export default function MyApp({ Component, pageProps }) {
  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
      <AuthGuard>
        <Component {...pageProps} />
      </AuthGuard>
    </SessionContextProvider>
  )
}
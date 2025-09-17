// pages/_app.js
import '../styles/globals.css'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider, useSession } from '@supabase/auth-helpers-react'
import AuthGuard from '../components/AuthGuard'

function App({ Component, pageProps }) {
  const [supabaseClient] = useState(() => createPagesBrowserClient())

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
      <AuthGuard>
        <Component {...pageProps} />
      </AuthGuard>
    </SessionContextProvider>
  )
}

export default App;

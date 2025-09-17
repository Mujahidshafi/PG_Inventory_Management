import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

const AuthGuard = ({ children }) => {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  const publicPaths = ['/login', '/forgotPassword', '/resetPassword']
  const employeeOnlyPaths = ['/employeeMenu']
    const adminOnlyPaths = ['/adminMenu', '/accountsManager', '/deleteItems', 'addNewItem', '/cleanStorageModify', 'cleanStorage', 'createAccount', 'createJob', 
        '/createJob', 'fieldRunModify', '/fieldRunStorage', '/inProcess', '/Sale', '/screeningStorage', '/screeningStorageModify', '/Search', 'SearchHistory', 'searchModify',
        '/StorageDashboard']

  // check user role
  useEffect(() => {
    const fetchRole = async () => {
      if (!session?.user) {
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (error) console.error('Error fetching role:', error)
      else setRole(data.role)

      setLoading(false)
    }

    fetchRole()
  }, [session])

  useEffect(() => {
  if (!loading) {
    if (!session && !publicPaths.includes(router.pathname)) {
      router.push('/login');
      return;
    }

    // Restrict employee-only pages
    if (
      employeeOnlyPaths.includes(router.pathname) &&
      role !== 'employee'
    ) {
      router.back();
    }

    // Restrict admin-only pages
    if (
      adminOnlyPaths.includes(router.pathname) &&
      role !== 'admin'
    ) {
      router.back();
    }
  }
}, [session, role, loading, router.pathname]);



  if (loading || (!session && !publicPaths.includes(router.pathname))) {
    return <div>Loading...</div>
  }

  return children
}

export default AuthGuard;

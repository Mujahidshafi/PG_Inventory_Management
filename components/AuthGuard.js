import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const publicPaths = ['/login', '/forgotPassword', '/resetPassword'];
const employeeOnlyPaths = ['/employeeMenu'];
const adminOnlyPaths = [
  '/adminMenu', '/accountsManager',
  '/cleanStorageModify', '/cleanStorage', '/createAccount', '/createJob',
  '/fieldRunModify', '/fieldRunStorage', '/Sale',
  '/screeningStorage', '/screeningStorageModify', '/search', 
  '/storageDashboard', '/orders', '/jobHistory', 'CropMenu',
  '/editFRStorageSuppliers', 'reports', '/managePeople', '/physicalBoxes',
  '/trash', '/insideCo2', '/baggedStorage',
  '/rerunStorage', '/trash'
];

const AuthGuard = ({ children }) => {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch role once session is available
  useEffect(() => {
    const fetchRole = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching role:', error);
      } else if (data && data.role) {
        setRole(data.role);
      } else {
        console.warn('No role found for user:', session.user.id);
        setRole(null);
      }

      setLoading(false);
    };

    fetchRole();
  }, [session, supabase]);

  // Redirect logic
  useEffect(() => {
    if (loading) return;

    const isRecovery = router.pathname === '/resetPassword';

    // Not logged in, redirect from protected pages (except recovery)
    if (!session && !publicPaths.includes(router.pathname)) {
      router.replace('/login');
      return;
    }

    // Logged in but on a public page
    if (session && publicPaths.includes(router.pathname) && !isRecovery) {
      if (role === 'admin') router.replace('/adminMenu');
      else if (role === 'employee') router.replace('/employeeMenu');
      return;
    }

    // Employee tries to access admin page
    if (role === 'employee' && adminOnlyPaths.includes(router.pathname)) {
      router.replace('/employeeMenu');
      return;
    }

    // Admin tries to access employee-only page
    if (role === 'admin' && employeeOnlyPaths.includes(router.pathname)) {
      router.replace('/adminMenu');
      return;
    }

  }, [session, role, loading, router]);

  if (loading) return <div>Loading...</div>;

  return children;
};

export default AuthGuard;

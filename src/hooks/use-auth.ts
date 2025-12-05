import authService from '@/services/supabase/auth.service';
import useUserStore from '@/states/user-store';
import { useEffect, useState } from 'react';

const useAuth = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const { setUserId, isAuthenticated, setIsAuthenticated } = useUserStore(
    (state) => state
  );

  useEffect(() => {
    (async () => {
      try {
        const session = await authService.getCurrentUser();

        setIsAuthenticated(!!session.data.user);
        setUserId(session.data.user?.id as string);
        setIsAuthenticating(false);
      } catch (error) {
        setIsAuthenticating(false);
      }
    })();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setIsAuthenticated(false);
    } catch (error) {
      console.log(error);
    }
  };

  return {
    isAuthenticating,
    isAuthenticated,
    handleLogout,
    setIsAuthenticated,
  };
};

export default useAuth;

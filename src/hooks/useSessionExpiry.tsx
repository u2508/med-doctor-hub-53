import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const WARNING_BEFORE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes before expiry
const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute

export const useSessionExpiry = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const warningShownRef = useRef(false);
  const toastIdRef = useRef<string | null>(null);

  const handleSessionRefresh = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (data.session) {
        warningShownRef.current = false;
        toast({
          title: 'Session Refreshed',
          description: 'Your session has been extended.',
        });
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      toast({
        title: 'Session Refresh Failed',
        description: 'Please sign in again.',
        variant: 'destructive',
      });
      navigate('/', { replace: true });
    }
  }, [toast, navigate]);

  useEffect(() => {
    const checkSessionExpiry = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;
        
        const expiresAt = session.expires_at;
        if (!expiresAt) return;
        
        const expiryTime = expiresAt * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;
        
        // Session has expired
        if (timeUntilExpiry <= 0) {
          toast({
            title: 'Session Expired',
            description: 'Your session has expired. Please sign in again.',
            variant: 'destructive',
          });
          await supabase.auth.signOut();
          navigate('/', { replace: true });
          return;
        }
        
        // Show warning before expiry
        if (timeUntilExpiry <= WARNING_BEFORE_EXPIRY_MS && !warningShownRef.current) {
          warningShownRef.current = true;
          const minutesLeft = Math.ceil(timeUntilExpiry / 60000);
          
          toast({
            title: 'Session Expiring Soon',
            description: `Your session will expire in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}. Click to refresh.`,
            duration: 10000,
            action: (
              <button 
                onClick={handleSessionRefresh}
                className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Refresh
              </button>
            ),
          });
        }
      } catch (error) {
        console.error('Error checking session expiry:', error);
      }
    };

    // Initial check
    checkSessionExpiry();
    
    // Set up interval
    const intervalId = setInterval(checkSessionExpiry, CHECK_INTERVAL_MS);
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') {
        warningShownRef.current = false;
      }
      if (event === 'SIGNED_OUT') {
        clearInterval(intervalId);
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.unsubscribe();
    };
  }, [toast, navigate, handleSessionRefresh]);

  return { refreshSession: handleSessionRefresh };
};

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { siteSettingsPublicApi } from '@/lib/api';

interface MaintenanceContextType {
  isLoading: boolean;
  isMaintenanceMode: boolean;
  isAllowed: boolean;
  message?: string;
}

const MaintenanceContext = createContext<MaintenanceContextType>({
  isLoading: true,
  isMaintenanceMode: false,
  isAllowed: true,
});

export function useMaintenanceMode() {
  return useContext(MaintenanceContext);
}

// Paths that should bypass maintenance check
const BYPASS_PATHS = ['/maintenance', '/admin', '/login', '/auth'];

export function MaintenanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MaintenanceContextType>({
    isLoading: true,
    isMaintenanceMode: false,
    isAllowed: true,
  });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkMaintenanceStatus();
  }, [pathname]);

  const checkMaintenanceStatus = async () => {
    // Skip check for bypass paths
    if (BYPASS_PATHS.some(path => pathname?.startsWith(path))) {
      setState({
        isLoading: false,
        isMaintenanceMode: false,
        isAllowed: true,
      });
      return;
    }

    try {
      const res = await siteSettingsPublicApi.getMaintenanceStatus();
      const data = res.data;

      setState({
        isLoading: false,
        isMaintenanceMode: data.maintenance_mode,
        isAllowed: data.is_allowed,
        message: data.message,
      });

      // If maintenance mode is on and user is not allowed, redirect
      if (data.maintenance_mode && !data.is_allowed && pathname !== '/maintenance') {
        router.push('/maintenance');
      }
    } catch (error) {
      // If API fails, allow access (fail open)
      console.error('Failed to check maintenance status:', error);
      setState({
        isLoading: false,
        isMaintenanceMode: false,
        isAllowed: true,
      });
    }
  };

  return (
    <MaintenanceContext.Provider value={state}>
      {children}
    </MaintenanceContext.Provider>
  );
}

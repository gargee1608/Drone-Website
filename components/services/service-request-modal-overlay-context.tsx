"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ServiceRequestModalOverlayContextValue = {
  /** Call when a service-request modal opens or closes. */
  setServiceRequestModalOpen: (open: boolean) => void;
  /** True while any service-request modal is open. */
  isServiceRequestModalOpen: boolean;
};

const ServiceRequestModalOverlayContext =
  createContext<ServiceRequestModalOverlayContextValue | null>(null);

export function ServiceRequestModalOverlayProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [openCount, setOpenCount] = useState(0);

  const setServiceRequestModalOpen = useCallback((open: boolean) => {
    setOpenCount((count) => {
      if (open) return count + 1;
      return Math.max(0, count - 1);
    });
  }, []);

  const value = useMemo(
    () => ({
      setServiceRequestModalOpen,
      isServiceRequestModalOpen: openCount > 0,
    }),
    [setServiceRequestModalOpen, openCount]
  );

  return (
    <ServiceRequestModalOverlayContext.Provider value={value}>
      {children}
    </ServiceRequestModalOverlayContext.Provider>
  );
}

export function useServiceRequestModalOverlay() {
  const ctx = useContext(ServiceRequestModalOverlayContext);
  if (!ctx) {
    return {
      setServiceRequestModalOpen: () => {},
      isServiceRequestModalOpen: false,
    };
  }
  return ctx;
}

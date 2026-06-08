'use client';

import { createContext, useContext } from 'react';
import type { WebAuthnConfig } from '../../server/config';

export interface ClientWebAuthnConfig {
  routes?: Partial<{
    registerBegin: string;
    registerFinish: string;
    loginBegin: string;
    loginFinish: string;
    logout: string;
    me: string;
  }>;
}

const defaultRoutes = {
  registerBegin: '/api/auth/register/begin',
  registerFinish: '/api/auth/register/finish',
  loginBegin: '/api/auth/login/begin',
  loginFinish: '/api/auth/login/finish',
  logout: '/api/auth/logout',
  me: '/api/auth/me',
};

const WebAuthnContext = createContext<ClientWebAuthnConfig | undefined>(undefined);

export function WebAuthnProvider({
  children,
  config,
}: {
  children: React.ReactNode;
  config?: ClientWebAuthnConfig;
}) {
  return <WebAuthnContext.Provider value={config}>{children}</WebAuthnContext.Provider>;
}

export function useClientWebAuthnConfig(override?: ClientWebAuthnConfig) {
  const context = useContext(WebAuthnContext);
  return {
    routes: {
      ...defaultRoutes,
      ...(context?.routes ?? {}),
      ...(override?.routes ?? {}),
    },
  };
}

export type { WebAuthnConfig };

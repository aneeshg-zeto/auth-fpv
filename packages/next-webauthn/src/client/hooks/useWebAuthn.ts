'use client'

import { useLogin } from './useLogin'
import { useRegister } from './useRegister'
import { useSession } from './useSession'
import type { ClientWebAuthnConfig } from './useRegister'

export function useWebAuthn(config?: ClientWebAuthnConfig) {
  const register = useRegister(config)
  const login = useLogin(config)
  const session = useSession(config)
  return {
    ...register,
    ...login,
    ...session,
    register,
    login,
    session,
  }
}

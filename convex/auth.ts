import { convexAuth } from '@convex-dev/auth/server'
import { Password } from '@convex-dev/auth/providers/Password'
import Google from '@auth/core/providers/google'

// Sign-in options. Google OAuth (needs AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET env
// vars) sits alongside email + password. Both create the same kind of account.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google,
    Password({
      profile(params) {
        return {
          email: params.email as string,
          name: (params.name as string) || (params.email as string).split('@')[0],
        }
      },
    }),
  ],
})

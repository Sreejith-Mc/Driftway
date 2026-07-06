import { convexAuth } from '@convex-dev/auth/server'
import { Password } from '@convex-dev/auth/providers/Password'

// Email + password sign-in, kept entirely inside Convex so there is no second
// auth service to configure or that could lapse. The custom profile captures
// the display name entered at sign-up.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
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

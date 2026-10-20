// Firebase is only used for "Continue with Google". Fill the VITE_FIREBASE_* values in frontend/.env
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId)

let auth
const getFirebaseAuth = () => {
    if (!firebaseConfigured) {
        throw new Error('Google sign-in is not set up yet. Add the VITE_FIREBASE_* values to frontend/.env')
    }
    if (!auth) auth = getAuth(initializeApp(config))
    return auth
}

// Opens the Google popup and returns a Firebase ID token for the backend to verify
export const signInWithGoogle = async () => {
    const fbAuth = getFirebaseAuth()
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const result = await signInWithPopup(fbAuth, provider)
    return result.user.getIdToken()
}

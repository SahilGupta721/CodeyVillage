import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_IDENTITY_PLATFORM_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_IDENTITY_PLATFORM_AUTH_DOMAIN,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
githubProvider.addScope("repo");

export { auth, googleProvider, githubProvider };

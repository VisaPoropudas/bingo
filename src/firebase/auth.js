import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from './config';

// Lista admin-sähköposteista
const ADMIN_EMAILS = [
  'visa.poropudas@gmail.com'
];

// Kirjaudu Google-tilillä
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Tarkista onko käyttäjä jo olemassa
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      // Määritä rooli: admin jos sähköposti on listalla, muuten pelaaja
      const role = ADMIN_EMAILS.includes(user.email) ? 'admin' : 'pelaaja';

      // Luo uusi käyttäjä
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName,
        role: role,
        createdAt: new Date().toISOString()
      });
    }

    return user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Kirjaudu sähköpostilla
export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Error signing in with email:", error);
    throw error;
  }
};

// Rekisteröidy sähköpostilla
export const registerWithEmail = async (email, password, displayName) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Määritä rooli: admin jos sähköposti on listalla, muuten pelaaja
    const role = ADMIN_EMAILS.includes(user.email) ? 'admin' : 'pelaaja';

    // Luo käyttäjäprofiili Firestoreen
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: displayName,
      role: role,
      createdAt: new Date().toISOString()
    });

    return user;
  } catch (error) {
    console.error("Error registering with email:", error);
    throw error;
  }
};

// Kirjaudu ulos
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Hae käyttäjän rooli
export const getUserRole = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().role;
    }
    return 'pelaaja'; // Oletusrooli
  } catch (error) {
    console.error("Error getting user role:", error);
    return 'pelaaja';
  }
};

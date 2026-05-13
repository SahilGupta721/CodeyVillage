'use client';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ExtensionAuthBridge() {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          const username =
            user.displayName ||
            user.email?.split('@')[0] ||
            user.uid.slice(0, 8);

          localStorage.setItem('firebaseUid', user.uid);
          localStorage.setItem(`username:${user.uid}`, username);

          window.postMessage(
            { type: 'codey-village-auth', uid: user.uid, idToken, username },
            '*',
          );
        } catch {}
      } else {
        localStorage.removeItem('firebaseUid');
        window.postMessage({ type: 'codey-village-signout' }, '*');
      }
    });
    return unsub;
  }, []);

  return null;
}

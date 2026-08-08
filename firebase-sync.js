import {
  firebaseConfig,
  isFirebaseConfigured
} from "./firebase-config.js";

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

let firebaseApp = null;
let firebaseAuth = null;
let firestoreDb = null;
let initializationPromise = null;
let currentUserPlan = "free";

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account"
});

export async function initializeFirebaseSync() {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    if (!isFirebaseConfigured()) {
      console.warn(
        "Firebase ainda não está configurado. O aplicativo continuará usando o armazenamento local."
      );

      return null;
    }

    try {
      firebaseApp = initializeApp(firebaseConfig);
      firebaseAuth = getAuth(firebaseApp);
      firestoreDb = getFirestore(firebaseApp);

      await setPersistence(
        firebaseAuth,
        browserLocalPersistence
      );

      try {
        await getRedirectResult(firebaseAuth);
      } catch (redirectError) {
        console.error(
          "Não foi possível concluir o redirecionamento do login:",
          redirectError
        );
      }

      return {
        app: firebaseApp,
        auth: firebaseAuth,
        db: firestoreDb
      };
    } catch (error) {
      console.error(
        "Não foi possível inicializar o Firebase:",
        error
      );

      return null;
    }
  })();

  return initializationPromise;
}

export async function loginWithGoogle() {
  const services = await initializeFirebaseSync();

  if (!services?.auth) {
    throw new Error(
      "O Firebase não está disponível neste momento."
    );
  }

  try {
    return await signInWithRedirect(
      services.auth,
      googleProvider
    );
  } catch (error) {
    const redirectFallbackErrors = [
      "auth/popup-blocked",
      "auth/operation-not-supported-in-this-environment",
      "auth/web-storage-unsupported"
    ];

    if (redirectFallbackErrors.includes(error.code)) {
      await signInWithRedirect(
        services.auth,
        googleProvider
      );

      return null;
    }

    throw error;
  }
}

export async function logoutFromGoogle() {
  const services = await initializeFirebaseSync();

  if (!services?.auth) {
    return;
  }

  await signOut(services.auth);
}

export async function getCurrentFirebaseUser() {
  const services = await initializeFirebaseSync();

  return services?.auth?.currentUser ?? null;
}

export async function observeFirebaseUser(callback) {
  const services = await initializeFirebaseSync();

  if (!services?.auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(
    services.auth,
    callback
  );
}
export async function saveFirebaseBackup(backup) {
  const services = await initializeFirebaseSync();

  if (!services?.auth || !services?.db) {
    throw new Error("Firebase não está disponível.");
  }

  const user = services.auth.currentUser;

  if (!user) {
    throw new Error("É necessário entrar com Google.");
  }

  if (!backup || typeof backup !== "object") {
    throw new Error("Backup inválido.");
  }

  const backupReference = doc(
    services.db,
    "userBackups",
    user.uid
  );

  await setDoc(backupReference, {
    ...backup,
    userId: user.uid,
    updatedAt: serverTimestamp()
  });

  return true;
}
export async function loadFirebaseBackup() {
  const services = await initializeFirebaseSync();

  if (!services?.auth || !services?.db) {
    throw new Error("Firebase não está disponível.");
  }

  const user = services.auth.currentUser;

  if (!user) {
    throw new Error("É necessário entrar com Google.");
  }

  const backupReference = doc(
    services.db,
    "userBackups",
    user.uid
  );

  const backupSnapshot = await getDoc(backupReference);

  if (!backupSnapshot.exists()) {
    return null;
  }

  return backupSnapshot.data();
}
export function getFirebaseServices() {
  return {
    app: firebaseApp,
    auth: firebaseAuth,
    db: firestoreDb
  };
}
  export async function loadUserPlan() {
  const services = await initializeFirebaseSync();

  if (!services?.auth || !services?.db) {
    return "free";
  }

  const user = services.auth.currentUser;

  if (!user) {
    currentUserPlan = "free";
    return currentUserPlan;
  }

  const userReference = doc(
    services.db,
    "users",
    user.uid
  );

  const userSnapshot = await getDoc(userReference);

  if (!userSnapshot.exists()) {
    currentUserPlan = "free";
    return currentUserPlan;
  }

  const userData = userSnapshot.data();

  currentUserPlan = userData.plan || "free";

  return currentUserPlan;
}
  return {
    app: firebaseApp,
    auth: firebaseAuth,
    db: firestoreDb
  };
}

/*
 * Deixa as funções acessíveis ao código antigo do app,
 * que ainda não utiliza módulos JavaScript.
 */
window.firebaseSync = {
  initializeFirebaseSync,
  loginWithGoogle,
  logoutFromGoogle,
  getCurrentFirebaseUser,
  observeFirebaseUser,
    getFirebaseServices,
  saveFirebaseBackup,
  loadFirebaseBackup
  loadUserPlan,
};

initializeFirebaseSync();

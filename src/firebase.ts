import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, enableIndexedDbPersistence, terminate, clearIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable offline persistence
if (typeof window !== 'undefined') {
  console.log("Firestore: Enabling persistence...");
  enableIndexedDbPersistence(db).then(() => {
    console.log("Firestore: Persistence enabled successfully.");
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore: Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore: The current browser does not support all of the features required to enable persistence');
    } else {
      console.error('Firestore: Error enabling persistence:', err);
    }
  });
}

export const storage = getStorage(app);
export const auth = getAuth(app);

// Connectivity monitoring
export const monitorConnectivity = (onStatusChange: (online: boolean) => void) => {
  const handleOnline = () => onStatusChange(true);
  const handleOffline = () => onStatusChange(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

async function testConnection() {
  try {
    const docRef = doc(db, 'test', 'connection');
    console.log("Testing connection to Firestore at path:", docRef.path);
    await getDocFromServer(docRef);
    console.log("Firestore connection successful!");
  } catch (error) {
    console.error("Firestore connection test failed:", error);
    if(error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('Missing or insufficient permissions'))) {
      console.error("Please check your Firebase configuration or internet connection. Your browser might be blocking the connection to Firestore (e.g., via an ad blocker or firewall).");
    }
  }
}
testConnection();

import { auth } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const currentUser = auth.currentUser;
  
  // If user is not logged in, ignore the error as it's likely a race condition during logout
  if (!currentUser) {
    console.warn(`Firestore ${operationType} on ${path} failed, but user is not logged in. Ignoring.`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser.uid,
      email: currentUser.email || '',
      emailVerified: currentUser.emailVerified,
      isAnonymous: currentUser.isAnonymous,
      tenantId: currentUser.tenantId || '',
      providerInfo: currentUser.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName || '',
        email: provider.email || '',
        photoUrl: provider.photoURL || ''
      }))
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Don't throw for permission errors to avoid crashing the app, just log them
  // throw new Error(JSON.stringify(errInfo));
}

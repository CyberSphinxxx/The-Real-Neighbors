import { db } from './firebase';
import {
  collection,
  doc,
  getDoc as firestoreGetDoc,
  setDoc as firestoreSetDoc,
  addDoc as firestoreAddDoc,
  updateDoc as firestoreUpdateDoc,
  deleteDoc as firestoreDeleteDoc,
  onSnapshot,
  query,
  QueryConstraint
} from 'firebase/firestore';
import type {
  DocumentData,
  PartialWithFieldValue,
  WithFieldValue,
  DocumentReference
} from 'firebase/firestore';

export const getDoc = async <T>(path: string, pathSegments: string[] = []): Promise<T | null> => {
  const docRef = doc(db, path, ...pathSegments);
  const docSnap = await firestoreGetDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
};

export const setDoc = async <T extends DocumentData>(
  path: string,
  pathSegments: string[],
  data: WithFieldValue<T>
): Promise<void> => {
  const docRef = doc(db, path, ...pathSegments) as DocumentReference<T, DocumentData>;
  await firestoreSetDoc(docRef, data, { merge: true });
};

export const addDoc = async <T extends DocumentData>(
  path: string,
  data: WithFieldValue<T>
): Promise<string> => {
  const colRef = collection(db, path);
  const docRef = await firestoreAddDoc(colRef, data as WithFieldValue<DocumentData>);
  return docRef.id;
};

export const updateDoc = async <T extends DocumentData>(
  path: string,
  pathSegments: string[],
  data: PartialWithFieldValue<T>
): Promise<void> => {
  const docRef = doc(db, path, ...pathSegments) as DocumentReference<T, DocumentData>;
  await firestoreUpdateDoc(docRef, data as any);
};

export const deleteDoc = async (path: string, ...pathSegments: string[]): Promise<void> => {
  const docRef = doc(db, path, ...pathSegments);
  await firestoreDeleteDoc(docRef);
};

export const subscribeToCollection = <T>(
  path: string,
  callback: (data: T[]) => void,
  ...queryConstraints: QueryConstraint[]
) => {
  const colRef = collection(db, path);
  const q = query(colRef, ...queryConstraints);
  
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as T[];
    callback(data);
  }, (error) => {
    console.error(`Error subscribing to collection ${path}:`, error.message);
  });
};

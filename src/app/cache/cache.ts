import firestore, { Firestore } from "@google-cloud/firestore";

import { getVariable } from "../environment/environment";

const CACHE_EXPIRATION = 60 * 60 * 1000; // 1 hour

type CacheDocument = {
  value: string;
  timestamp: number;
};

// Create a firestore converter
const converter = {
  toFirestore: (data: CacheDocument) => {
    return data;
  },
  fromFirestore: (snapshot: firestore.QueryDocumentSnapshot<CacheDocument>) => {
    const data = snapshot.data();

    return data;
  },
};

const getFirestoreDocument = async (): Promise<firestore.DocumentSnapshot<CacheDocument>> => {
  const collection = getVariable("FIRESTORE_COLLECTION");
  const document = getVariable("FIRESTORE_DOCUMENT");
  const client = new Firestore();
  const documentRef = client.collection(collection).doc(document).withConverter(converter);

  return await documentRef.get();
};

export const getCachedValue = async (): Promise<string | null> => {
  const document = await getFirestoreDocument();
  const data = await document.data();

  // If no or incomplete data
  if (!data || !data.value || !data.timestamp) {
    console.log("Cache miss");
    return null;
  }

  // If cache is expired
  if (Date.now() - data.timestamp > CACHE_EXPIRATION) {
    console.log("Expired");
    return null;
  }

  console.log("Cache hit");
  return data.value;
};

export const setCachedValue = async (value: string): Promise<void> => {
  const document = await getFirestoreDocument();

  console.log("Updating cache");
  await document.ref.set({
    value,
    timestamp: Date.now(),
  });
};

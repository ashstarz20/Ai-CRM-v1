import { db } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { CustomField } from "../types/types";

export const fetchCustomFields = async (
  userPhone: string
): Promise<CustomField[]> => {
  if (!userPhone) return [];

  const col = collection(db, `crm_users/${userPhone}/custom_fields`);
  const snapshot = await getDocs(col);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as CustomField)
  );
};

export const addCustomField = async (
  userPhone: string,
  field: Omit<CustomField, "id">
): Promise<CustomField> => {
  const docRef = await addDoc(
    collection(db, `crm_users/${userPhone}/custom_fields`),
    field
  );
  return { id: docRef.id, ...field };
};

export const deleteCustomField = async (
  userPhone: string,
  id: string
): Promise<void> => {
  const docRef = doc(db, `crm_users/${userPhone}/custom_fields`, id);
  await deleteDoc(docRef);
};

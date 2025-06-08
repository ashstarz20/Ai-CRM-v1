import { db } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { CustomKpi } from "../types/types";

export const fetchCustomKpis = async (
  userPhone: string
): Promise<CustomKpi[]> => {
  if (!userPhone) return [];

  const q = query(
    collection(db, "crm_users", userPhone, "custom_kpis"),
    where("user_phone", "==", userPhone)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as CustomKpi)
  );
};

export const addCustomKpi = async (
  userPhone: string,
  kpi: Omit<CustomKpi, "id">
): Promise<CustomKpi> => {
  const docRef = await addDoc(
    collection(db, "crm_users", userPhone, "custom_kpis"),
    {
      ...kpi,
      user_phone: userPhone,
    }
  );
  return { id: docRef.id, ...kpi };
};

export const updateCustomKpi = async (
  userPhone: string,
  id: string,
  kpi: Partial<Omit<CustomKpi, "id">>
): Promise<void> => {
  if (!userPhone) throw new Error("Missing userPhone");
  const docRef = doc(db, "crm_users", userPhone, "custom_kpis", id);
  await updateDoc(docRef, {
    ...kpi,
    user_phone: userPhone, // keep this in sync if you need it
  });
};

export const deleteCustomKpi = async (
  userPhone: string,
  id: string
): Promise<void> => {
  if (!userPhone) throw new Error("Missing userPhone");
  const docRef = doc(db, "crm_users", userPhone, "custom_kpis", id);
  await deleteDoc(docRef);
};

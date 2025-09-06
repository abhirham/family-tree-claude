import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where 
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'familyMembers';
const USERS_COLLECTION_NAME = 'users';

// Add a new family member
export async function addFamilyMember(memberData) {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...memberData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding family member:', error);
    throw error;
  }
}

// Get all family members
export async function getAllFamilyMembers() {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching family members:', error);
    throw error;
  }
}

// Get a specific family member
export async function getFamilyMember(id) {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('Family member not found');
    }
  } catch (error) {
    console.error('Error fetching family member:', error);
    throw error;
  }
}

// Update a family member
export async function updateFamilyMember(id, updates) {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating family member:', error);
    throw error;
  }
}

// Delete a family member
export async function deleteFamilyMember(id) {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting family member:', error);
    throw error;
  }
}

// Get children of a specific family member
export async function getChildren(parentId) {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('parentIds', 'array-contains', parentId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching children:', error);
    throw error;
  }
}
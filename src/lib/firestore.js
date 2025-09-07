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

// Add a new family member with relationship processing
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

// Generate unique parentId
function generateUniqueParentId() {
  return 'parent_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Add family member with relationship processing
export async function addFamilyMemberWithRelationships(formData) {
  const { linkedMemberId, relationshipType, ...memberData } = formData;
  
  try {
    let finalMemberData = {
      ...memberData,
      linkedMemberId: null,  // Don't store UI relationship data
      relationshipType: null
    };

    // If no relationship (first user), add unique parentId and set as root
    if (!linkedMemberId || !relationshipType) {
      finalMemberData.parentId = generateUniqueParentId();
      finalMemberData.root = true;
      console.log('🔍 Debug: First user detected, adding parentId and root=true:', finalMemberData.parentId);
    }

    console.log('🔍 Debug: Final member data to store:', finalMemberData);

    // First add the new member
    const newMemberId = await addFamilyMember(finalMemberData);
    
    console.log('🔍 Debug: Member stored with ID:', newMemberId);
    
    // If there's a relationship, update the related member
    if (linkedMemberId && relationshipType) {
      const linkedMember = await getFamilyMember(linkedMemberId);
      let updates = {};
      
      switch (relationshipType) {
        case 'parent':
          // New member (Anand) is becoming parent of linked member (Abhi)
          // Get linked member's data to find siblings
          const linkedMemberData = await getFamilyMember(linkedMemberId);
          
          // Get all people who share the same parentId as linkedMember (including linkedMember)
          const allMembers = await getAllFamilyMembers();
          const allSiblings = allMembers.filter(member => 
            member.parentId === linkedMemberData.parentId
          );
          
          // Set up the NEW member (Anand) as actual parent with all siblings as children
          const childIds = allSiblings.map(s => s.id);
          console.log('🔍 Debug: Setting up new parent with childIds:', childIds);
          console.log('🔍 Debug: New parent ID:', newMemberId);
          
          // The first parent added automatically takes over the root status
          // Remove root from all previous root members (children who had root=true)
          await updateFamilyMember(newMemberId, {
            childIds: childIds,
            parentId: null,  // Remove parentId from new parent
            root: true  // First parent always gets root=true
          });
          
          // Remove parentId and root from all siblings (they now have a real parent)
          // Children lose root status when parent is added
          console.log('🔍 Debug: Removing parentId and root from siblings:', allSiblings.map(s => s.name));
          for (const sibling of allSiblings) {
            await updateFamilyMember(sibling.id, {
              parentId: null,
              root: false
            });
          }
          break;
          
        case 'child':
          // Validation: Can only add a child if the user has a spouse
          if (!linkedMember.spouseId) {
            throw new Error('Cannot add a child to a user without a spouse. Please add a spouse first.');
          }
          
          // New member is child of linked member
          // Add new member ID to linked member's childIds
          const parentChildren = linkedMember.childIds || [];
          if (!parentChildren.includes(newMemberId)) {
            updates.childIds = [...parentChildren, newMemberId];
          }
          
          // Also add the child to the spouse's childIds
          const spouse = await getFamilyMember(linkedMember.spouseId);
          const spouseChildren = spouse.childIds || [];
          if (!spouseChildren.includes(newMemberId)) {
            await updateFamilyMember(linkedMember.spouseId, {
              childIds: [...spouseChildren, newMemberId]
            });
          }
          
          // Children do NOT inherit root status from parent - they get root=false
          await updateFamilyMember(newMemberId, {
            parentId: null,
            root: false
          });
          break;
          
        case 'spouse':
          // Bidirectional spouse relationship
          updates.spouseId = newMemberId;
          
          // If the new spouse is male and being added to a root user, they take over root status
          const shouldTakeOverRoot = memberData.gender === 'male' && linkedMember.root === true;
          
          if (shouldTakeOverRoot) {
            // New male spouse becomes root
            await updateFamilyMember(newMemberId, {
              spouseId: linkedMemberId,
              parentId: null,
              root: true
            });
            
            // Remove root from the original user
            updates.root = false;
          } else {
            // Regular spouse behavior - no root status
            await updateFamilyMember(newMemberId, {
              spouseId: linkedMemberId,
              parentId: null,
              root: false
            });
          }
          break;
          
        case 'sibling':
          // Share the same parentId as the linked member
          const linkedMemberForSibling = await getFamilyMember(linkedMemberId);
          if (linkedMemberForSibling.parentId) {
            // Both have the same parentId, siblings inherit root status from root users
            const inheritRoot = linkedMemberForSibling.root === true;
            await updateFamilyMember(newMemberId, {
              parentId: linkedMemberForSibling.parentId,
              root: inheritRoot
            });
          } else if (linkedMemberForSibling.childIds) {
            // LinkedMember is already a real parent, add new member as their child
            const parentChildren = linkedMemberForSibling.childIds || [];
            if (!parentChildren.includes(newMemberId)) {
              updates.childIds = [...parentChildren, newMemberId];
            }
            
            // Remove parentId from new member, children do not inherit root
            await updateFamilyMember(newMemberId, {
              parentId: null,
              root: false
            });
          }
          break;
      }
      
      // Update the linked member if needed
      if (Object.keys(updates).length > 0) {
        await updateFamilyMember(linkedMemberId, updates);
      }
    }
    
    return newMemberId;
    
  } catch (error) {
    console.error('Error adding family member with relationships:', error);
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

// Test function to verify relationship storage
export async function testRelationshipFlow(parentName, childName) {
  try {
    const allMembers = await getAllFamilyMembers();
    
    const parent = allMembers.find(member => 
      member.name.toLowerCase().includes(parentName.toLowerCase())
    );
    const child = allMembers.find(member => 
      member.name.toLowerCase().includes(childName.toLowerCase())
    );
    
    if (!parent) {
      console.log(`❌ Parent "${parentName}" not found`);
      return false;
    }
    
    if (!child) {
      console.log(`❌ Child "${childName}" not found`);
      return false;
    }
    
    console.log(`🔍 Testing relationship between ${parent.name} (parent) and ${child.name} (child)`);
    console.log(`👨‍👩‍👧‍👦 Parent's childIds:`, parent.childIds || []);
    
    if (parent.childIds && parent.childIds.includes(child.id)) {
      console.log(`✅ SUCCESS: ${child.name}'s ID (${child.id}) is stored in ${parent.name}'s childIds`);
      return true;
    } else {
      console.log(`❌ FAILED: ${child.name}'s ID is NOT in ${parent.name}'s childIds`);
      return false;
    }
    
  } catch (error) {
    console.error('Error testing relationship flow:', error);
    return false;
  }
}
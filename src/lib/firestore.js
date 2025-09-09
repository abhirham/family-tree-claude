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


// Add family member with relationship processing
export async function addFamilyMemberWithRelationships(formData) {
  const { linkedMemberId, relationshipType, ...memberData } = formData;
  
  try {
    let finalMemberData = {
      ...memberData,
    };

    // If no relationship (first user), set as root without any parent references
    if (!linkedMemberId || !relationshipType) {
      finalMemberData.parentIds = [];
      finalMemberData.root = true;
      console.log('🔍 Debug: First user detected, setting parentIds=[] and root=true');
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
          // Check if linked member already has parents
          const allMembers = await getAllFamilyMembers();
          const existingParents = allMembers.filter(member => 
            member.id === linkedMemberId
          ).reduce((parents, member) => {
            if (member.parentIds && member.parentIds.length > 0) {
              return allMembers.filter(m => member.parentIds.includes(m.id));
            }
            return [];
          }, []);
          
          if (existingParents.length > 0) {
            // Convert to spouse relationship with first existing parent
            console.log('🔄 Debug: Converting parent to spouse relationship');
            const existingParent = existingParents[0];
            
            // Set up bidirectional spouse relationship with existing parent
            await updateFamilyMember(existingParent.id, {
              spouseId: newMemberId
            });
            await updateFamilyMember(newMemberId, {
              spouseId: existingParent.id,
              parentIds: [],
              root: false
            });
            
            // Update all children to have both parents in their parentIds
            const childrenToUpdate = allMembers.filter(child => 
              child.parentIds && child.parentIds.includes(existingParent.id)
            );
            for (const child of childrenToUpdate) {
              const updatedParentIds = [...child.parentIds];
              if (!updatedParentIds.includes(newMemberId)) {
                updatedParentIds.push(newMemberId);
              }
              await updateFamilyMember(child.id, {
                parentIds: updatedParentIds
              });
            }
            
            console.log(`🔄 Debug: Added ${memberData.name} as spouse to ${existingParent.name}`);
          } else {
            // Original parent logic for when no parent exists
            // New member (Anand) is becoming parent of linked member (Abhi)
            // Get linked member's data to find siblings
            const linkedMemberData = await getFamilyMember(linkedMemberId);
            
            // Get all people who are siblings (same generation without parents)
            const allSiblings = [linkedMemberData]; // Start with the linked member
            
            // Add any other root members that should become children
            const otherRootMembers = allMembers.filter(member => 
              member.root === true && member.id !== linkedMemberId && 
              (!member.parentIds || member.parentIds.length === 0)
            );
            allSiblings.push(...otherRootMembers);
            
            console.log('🔍 Debug: Setting up new parent for children:', allSiblings.map(s => s.name));
            console.log('🔍 Debug: New parent ID:', newMemberId);
            
            // The first parent added automatically takes over the root status
            await updateFamilyMember(newMemberId, {
              parentIds: [],  // Parents have no parents
              root: true  // First parent always gets root=true
            });
            
            // Update all siblings to have this new parent in their parentIds
            console.log('🔍 Debug: Adding parent to children:', allSiblings.map(s => s.name));
            for (const sibling of allSiblings) {
              await updateFamilyMember(sibling.id, {
                parentIds: [newMemberId],
                root: false
              });
            }
          }
          break;
          
        case 'child':
          // Validation: Can only add a child if the user has a spouse
          if (!linkedMember.spouseId) {
            throw new Error('Cannot add a child to a user without a spouse. Please add a spouse first.');
          }
          
          // New member is child of linked member
          // Set up parentIds for the new child
          const parentIds = [linkedMemberId];
          
          // Add spouse as second parent if exists
          if (linkedMember.spouseId) {
            parentIds.push(linkedMember.spouseId);
          }
          
          // Children do NOT inherit root status from parent - they get root=false
          await updateFamilyMember(newMemberId, {
            parentIds: parentIds,
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
              parentIds: [],
              root: true
            });
            
            // Remove root from the original user
            updates.root = false;
          } else {
            // Regular spouse behavior - no root status
            await updateFamilyMember(newMemberId, {
              spouseId: linkedMemberId,
              parentIds: [],
              root: false
            });
          }
          break;
          
        case 'sibling':
          // Share the same parentId as the linked member
          const linkedMemberForSibling = await getFamilyMember(linkedMemberId);
          
          // Check if the linked member is a root user
          if (linkedMemberForSibling.root === true) {
            // Adding sibling to a root user - both should be root users
            if (linkedMemberForSibling.parentIds && linkedMemberForSibling.parentIds.length > 0) {
              // Root user has parents - share the same parentIds and inherit root status
              await updateFamilyMember(newMemberId, {
                parentIds: [...linkedMemberForSibling.parentIds],
                root: true  // Siblings of root users inherit root status
              });
            } else {
              // Root user has no parents - both should remain root users without parents
              await updateFamilyMember(newMemberId, {
                parentIds: [],
                root: true  // Siblings of root users inherit root status
              });
            }
          } else if (linkedMemberForSibling.parentIds && linkedMemberForSibling.parentIds.length > 0) {
            // Non-root user with parents - normal sibling relationship
            await updateFamilyMember(newMemberId, {
              parentIds: [...linkedMemberForSibling.parentIds],
              root: false
            });
          } else {
            // LinkedMember has no parents - they are effectively siblings in the same generation
            await updateFamilyMember(newMemberId, {
              parentIds: [],
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
    console.log(`👨‍👩‍👧‍👦 Child's parentIds:`, child.parentIds || []);
    
    if (child.parentIds && child.parentIds.includes(parent.id)) {
      console.log(`✅ SUCCESS: ${parent.name}'s ID (${parent.id}) is stored in ${child.name}'s parentIds`);
      return true;
    } else {
      console.log(`❌ FAILED: ${parent.name}'s ID is NOT in ${child.name}'s parentIds`);
      return false;
    }
    
  } catch (error) {
    console.error('Error testing relationship flow:', error);
    return false;
  }
}
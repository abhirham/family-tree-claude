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
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import { deleteImage, deleteImages } from './imageUpload';

const COLLECTION_NAME = 'familyMembers';
const USERS_COLLECTION_NAME = 'users';
const BRANCHES_COLLECTION_NAME = 'branches';

// Generate unique dummy parent ID for sibling groups
function generateDummyParentId() {
  return 'dummy_parent_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Add a new family member with relationship processing
export async function addFamilyMember(memberData) {
  // Check if user is authenticated
  if (!auth.currentUser) {
    throw new Error('Authentication required to add family members');
  }
  
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...memberData,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: auth.currentUser.uid // Track who created the record
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding family member:', error);
    throw error;
  }
}


// Add family member with relationship processing
export async function addFamilyMemberWithRelationships(formData) {
  // Check if user is authenticated
  if (!auth.currentUser) {
    throw new Error('Authentication required to add family members');
  }
  
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
            // New member is becoming parent of linked member
            // Get linked member's data to find ALL siblings
            const linkedMemberData = await getFamilyMember(linkedMemberId);
            
            // Find all siblings of the linked member
            const allSiblings = [linkedMemberData]; // Start with the linked member
            
            if (linkedMemberData.parentIds && linkedMemberData.parentIds.length > 0) {
              // Find siblings who share the same parent IDs (including dummy parents)
              const siblings = allMembers.filter(member => 
                member.id !== linkedMemberId && 
                member.parentIds && 
                member.parentIds.some(pid => linkedMemberData.parentIds.includes(pid))
              );
              allSiblings.push(...siblings);
            } else {
              // No parents - find other root members without parents to group together
              const otherRootMembers = allMembers.filter(member => 
                member.root === true && member.id !== linkedMemberId && 
                (!member.parentIds || member.parentIds.length === 0)
              );
              allSiblings.push(...otherRootMembers);
            }
            
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
              // Replace dummy parent IDs or empty parentIds with the new real parent
              const filteredParentIds = sibling.parentIds ? 
                sibling.parentIds.filter(pid => !pid.startsWith('dummy_parent_')) : [];
              
              await updateFamilyMember(sibling.id, {
                parentIds: [...filteredParentIds, newMemberId],
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
          
          // 🚨 BUG FIX: Update all existing children to have both parents
          console.log('🔧 Bug Fix: Adding spouse to parent with existing children');
          const familyMembers = await getAllFamilyMembers();
          const existingChildren = familyMembers.filter(member => 
            member.parentIds && member.parentIds.includes(linkedMemberId)
          );
          
          console.log(`🔧 Found ${existingChildren.length} existing children to update:`, existingChildren.map(c => c.name));
          
          // Update each existing child to include the new spouse as a parent
          for (const child of existingChildren) {
            const updatedParentIds = [...child.parentIds];
            if (!updatedParentIds.includes(newMemberId)) {
              updatedParentIds.push(newMemberId);
              await updateFamilyMember(child.id, {
                parentIds: updatedParentIds
              });
              console.log(`🔧 Updated ${child.name} to have both parents:`, updatedParentIds);
            }
          }
          
          console.log('✅ Bug Fix: All existing children now have both parents');
          break;
          
        case 'sibling':
          // Share the same parentIds as the linked member
          const linkedMemberForSibling = await getFamilyMember(linkedMemberId);
          
          // Check if the linked member is a root user
          if (linkedMemberForSibling.root === true) {
            // Adding sibling to a root user - both should be root users
            if (linkedMemberForSibling.parentIds && linkedMemberForSibling.parentIds.length > 0) {
              // Root user already has parents - share the same parentIds and inherit root status
              await updateFamilyMember(newMemberId, {
                parentIds: [...linkedMemberForSibling.parentIds],
                root: true  // Siblings of root users inherit root status
              });
            } else {
              // Root user has no parents - create a dummy parent ID to group them as siblings
              const dummyParentId = generateDummyParentId();
              console.log('🔍 Debug: Creating dummy parent ID for root siblings:', dummyParentId);
              
              // Update the existing root user to have the dummy parent ID
              await updateFamilyMember(linkedMemberId, {
                parentIds: [dummyParentId]
              });
              
              // Set the new sibling with the same dummy parent ID and root status
              await updateFamilyMember(newMemberId, {
                parentIds: [dummyParentId],
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
            // LinkedMember has no parents - create a dummy parent to group them as siblings
            const dummyParentId = generateDummyParentId();
            console.log('🔍 Debug: Creating dummy parent ID for non-root siblings:', dummyParentId);
            
            // Update the existing member to have the dummy parent ID
            await updateFamilyMember(linkedMemberId, {
              parentIds: [dummyParentId]
            });
            
            // Set the new sibling with the same dummy parent ID
            await updateFamilyMember(newMemberId, {
              parentIds: [dummyParentId],
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
  // Check if user is authenticated
  if (!auth.currentUser) {
    throw new Error('Authentication required to update family members');
  }
  
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
      updatedBy: auth.currentUser.uid // Track who updated the record
    });
  } catch (error) {
    console.error('Error updating family member:', error);
    throw error;
  }
}

// Delete a family member and associated images
export async function deleteFamilyMember(id) {
  // Check if user is authenticated
  if (!auth.currentUser) {
    throw new Error('Authentication required to delete family members');
  }
  
  try {
    // First get the member data to find associated images
    const member = await getFamilyMember(id);
    
    // Collect image paths to delete
    const imagesToDelete = [];
    
    // Add profile image path if it's a Firebase Storage URL
    if (member.imageUrl && member.imageUrl.includes('firebase')) {
      try {
        const profilePath = extractStoragePathFromUrl(member.imageUrl);
        if (profilePath) imagesToDelete.push(profilePath);
      } catch (e) {
        console.warn('Could not extract profile image path:', e);
      }
    }
    
    // Add gallery image paths
    if (member.galleryImages && Array.isArray(member.galleryImages)) {
      member.galleryImages.forEach(galleryImage => {
        if (galleryImage.path) {
          imagesToDelete.push(galleryImage.path);
        } else if (galleryImage.url && galleryImage.url.includes('firebase')) {
          try {
            const galleryPath = extractStoragePathFromUrl(galleryImage.url);
            if (galleryPath) imagesToDelete.push(galleryPath);
          } catch (e) {
            console.warn('Could not extract gallery image path:', e);
          }
        }
      });
    }
    
    // Delete the member document
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    
    // Delete associated images (don't fail if image deletion fails)
    if (imagesToDelete.length > 0) {
      try {
        await deleteImages(imagesToDelete);
        console.log('Successfully deleted images for member:', id);
      } catch (imageError) {
        console.warn('Warning: Could not delete some images for member', id, ':', imageError);
        // Don't throw error - member deletion succeeded
      }
    }
    
  } catch (error) {
    console.error('Error deleting family member:', error);
    throw error;
  }
}

// Helper function to extract storage path from Firebase Storage URL
function extractStoragePathFromUrl(url) {
  try {
    // Firebase Storage URLs have format: https://firebasestorage.googleapis.com/v0/b/bucket/o/path?alt=media&token=...
    const matches = url.match(/\/o\/([^?]+)/);
    if (matches) {
      return decodeURIComponent(matches[1]);
    }
    return null;
  } catch (error) {
    console.warn('Error extracting storage path from URL:', error);
    return null;
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

// ===== USER MANAGEMENT FUNCTIONS =====

// Create a new user profile in Firestore
export async function createUserProfile(userData) {
  if (!auth.currentUser) {
    throw new Error('Authentication required to create user profiles');
  }
  
  try {
    const docRef = await addDoc(collection(db, USERS_COLLECTION_NAME), {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: auth.currentUser.uid
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

// Get all users
export async function getAllUsers() {
  try {
    const q = query(collection(db, USERS_COLLECTION_NAME), orderBy('email'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

// Get a specific user profile
export async function getUserProfile(uid) {
  try {
    const docRef = doc(db, USERS_COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

// Update user profile
export async function updateUserProfile(uid, updates) {
  if (!auth.currentUser) {
    throw new Error('Authentication required to update user profiles');
  }
  
  try {
    const docRef = doc(db, USERS_COLLECTION_NAME, uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
      updatedBy: auth.currentUser.uid
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

// ===== BRANCH MANAGEMENT FUNCTIONS =====

// Create a new branch
export async function createBranch(branchData) {
  if (!auth.currentUser) {
    throw new Error('Authentication required to create branches');
  }
  
  try {
    const docRef = await addDoc(collection(db, BRANCHES_COLLECTION_NAME), {
      ...branchData,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: auth.currentUser.uid
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating branch:', error);
    throw error;
  }
}

// Get all branches
export async function getAllBranches() {
  try {
    const q = query(collection(db, BRANCHES_COLLECTION_NAME), orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching branches:', error);
    throw error;
  }
}

// Get branches for a specific user
export async function getUserBranches(uid) {
  try {
    const q = query(
      collection(db, BRANCHES_COLLECTION_NAME), 
      where('adminUids', 'array-contains', uid)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching user branches:', error);
    throw error;
  }
}

// Calculate all descendants of a family member
export async function calculateBranchMembers(rootMemberId) {
  try {
    const allMembers = await getAllFamilyMembers();
    const branchMembers = new Set([rootMemberId]);
    const visited = new Set();
    
    function findDescendants(memberId) {
      if (visited.has(memberId)) return;
      visited.add(memberId);
      
      // Find children
      const children = allMembers.filter(member => 
        member.parentIds && member.parentIds.includes(memberId)
      );
      
      children.forEach(child => {
        branchMembers.add(child.id);
        findDescendants(child.id);
      });
      
      // Find spouse
      const member = allMembers.find(m => m.id === memberId);
      if (member?.spouseId) {
        branchMembers.add(member.spouseId);
        findDescendants(member.spouseId);
      }
    }
    
    findDescendants(rootMemberId);
    return Array.from(branchMembers);
  } catch (error) {
    console.error('Error calculating branch members:', error);
    throw error;
  }
}

// Create branch from a family member
export async function createBranchFromMember(memberId, adminData) {
  if (!auth.currentUser) {
    throw new Error('Authentication required to create branches');
  }
  
  try {
    const member = await getFamilyMember(memberId);
    if (!member) {
      throw new Error('Family member not found');
    }
    
    const branchName = `${member.name} Branch`;
    let adminUid;
    
    // Handle admin creation or assignment
    if (adminData.isExisting) {
      // Assign existing admin
      adminUid = adminData.uid;
    } else {
      // Create new admin
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        adminData.email, 
        adminData.tempPassword
      );
      adminUid = userCredential.user.uid;
      
      // Create user profile
      await createUserProfile({
        uid: adminUid,
        email: adminData.email,
        role: 'branch_admin',
        branchIds: [], // Will be updated after branch creation
        mustChangePassword: true
      });
    }
    
    // Create branch
    const branchId = await createBranch({
      name: branchName,
      rootMemberId: memberId,
      adminUids: [adminUid]
    });
    
    // Calculate branch members
    const branchMemberIds = await calculateBranchMembers(memberId);
    
    // Update family members with branch assignment
    for (const memberIdToUpdate of branchMemberIds) {
      await updateFamilyMember(memberIdToUpdate, {
        branchId: branchId,
        managedBy: [adminUid]
      });
    }
    
    // Update user profile with branch assignment
    if (adminData.isExisting) {
      const currentProfile = await getUserProfile(adminUid);
      const updatedBranchIds = [...(currentProfile?.branchIds || []), branchId];
      await updateUserProfile(adminUid, { branchIds: updatedBranchIds });
    } else {
      await updateUserProfile(adminUid, { branchIds: [branchId] });
    }
    
    return {
      branchId,
      adminUid,
      branchMemberIds
    };
    
  } catch (error) {
    console.error('Error creating branch from member:', error);
    throw error;
  }
}

// Check if user can edit a specific family member
export async function canUserEditMember(userUid, memberId) {
  try {
    if (!userUid) return false;
    
    const userProfile = await getUserProfile(userUid);
    if (!userProfile) return false;
    
    // Super admin can edit anyone
    if (userProfile.role === 'super_admin') return true;
    
    const member = await getFamilyMember(memberId);
    if (!member) return false;
    
    // Check if user is in the member's managedBy list
    return member.managedBy && member.managedBy.includes(userUid);
  } catch (error) {
    console.error('Error checking user permissions:', error);
    return false;
  }
}

// Get user permissions
export async function getUserPermissions(userUid) {
  try {
    if (!userUid) return { role: 'public', branches: [], canEditAll: false };
    
    const userProfile = await getUserProfile(userUid);
    if (!userProfile) return { role: 'public', branches: [], canEditAll: false };
    
    const branches = await getUserBranches(userUid);
    
    return {
      role: userProfile.role || 'branch_admin',
      branches: branches,
      canEditAll: userProfile.role === 'super_admin',
      mustChangePassword: userProfile.mustChangePassword || false
    };
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return { role: 'public', branches: [], canEditAll: false };
  }
}

// Create super admin account (for initial setup)
export async function createSuperAdmin(email, password) {
  const wasSignedIn = !!auth.currentUser;
  const previousUser = auth.currentUser;
  
  try {
    let user;
    let userCreated = false;
    
    try {
      // Try to create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
      userCreated = true;
      console.log('Firebase Auth user created:', user.uid);
    } catch (authError) {
      if (authError.code === 'auth/email-already-in-use') {
        // User exists in Firebase Auth, try to sign in to get the UID
        try {
          const signInCredential = await signInWithEmailAndPassword(auth, email, password);
          user = signInCredential.user;
          console.log('Signed in to existing Firebase Auth user:', user.uid);
        } catch (signInError) {
          throw new Error('Email exists in Firebase Auth but password is incorrect. Please check the password or delete the existing user in Firebase Auth console.');
        }
      } else {
        throw authError;
      }
    }
    
    // Check if user profile already exists in Firestore
    const existingProfile = await getUserProfile(user.uid);
    if (existingProfile) {
      console.log('User profile already exists in Firestore with role:', existingProfile.role);
      
      // Sign out the temp user and restore previous session if needed
      await signOut(auth);
      if (wasSignedIn && previousUser) {
        // Note: We can't easily restore the previous session, user will need to login again
      }
      
      return {
        uid: user.uid,
        email: user.email,
        role: existingProfile.role,
        existed: true
      };
    }
    
    // Create user profile in Firestore
    const userProfile = {
      uid: user.uid,
      email: user.email,
      role: 'super_admin',
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await addDoc(collection(db, USERS_COLLECTION_NAME), userProfile);
    
    // Sign out the temp user and restore previous session if needed
    await signOut(auth);
    if (wasSignedIn && previousUser) {
      // Note: We can't easily restore the previous session, user will need to login again
    }
    
    console.log('Super admin created successfully:', email);
    return {
      uid: user.uid,
      email: user.email,
      role: 'super_admin',
      existed: false
    };
  } catch (error) {
    console.error('Error creating super admin:', error);
    
    // Try to restore previous session if something went wrong
    if (wasSignedIn && previousUser && auth.currentUser?.uid !== previousUser.uid) {
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error('Error signing out during cleanup:', signOutError);
      }
    }
    
    throw error;
  }
}
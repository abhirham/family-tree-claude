'use client';

import { useState, useEffect } from 'react';
import { addFamilyMemberWithRelationships, getAllFamilyMembers, testRelationshipFlow } from '@/lib/firestore';

export default function AddFamilyMemberForm({ onMemberAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    deathDate: '',
    gender: '',
    spouseId: '',
    notes: '',
    imageUrl: '',
    linkedMemberId: '',
    relationshipType: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [existingMembers, setExistingMembers] = useState([]);
  const [isFirstUser, setIsFirstUser] = useState(false);

  useEffect(() => {
    const fetchExistingMembers = async () => {
      try {
        const members = await getAllFamilyMembers();
        setExistingMembers(members);
        setIsFirstUser(members.length === 0);
      } catch (err) {
        console.error('Error fetching existing members:', err);
      }
    };

    fetchExistingMembers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate relationships for non-first users
    if (!isFirstUser && (!formData.linkedMemberId || !formData.relationshipType)) {
      setError('Link to Existing Family Member and Relationship Type are required for all users except the first one.');
      setIsLoading(false);
      return;
    }

    // Validate child relationship requires spouse
    if (formData.relationshipType === 'child' && formData.linkedMemberId) {
      const selectedMember = existingMembers.find(m => m.id === formData.linkedMemberId);
      if (!selectedMember?.spouseId) {
        setError('Cannot add a child to a user without a spouse. Please add a spouse first.');
        setIsLoading(false);
        return;
      }
    }

    // Validate dates
    if (formData.birthDate && formData.deathDate) {
      const birthDate = new Date(formData.birthDate);
      const deathDate = new Date(formData.deathDate);
      
      if (deathDate <= birthDate) {
        setError('Death date must be after birth date.');
        setIsLoading(false);
        return;
      }
    }

    // Validate sibling relationship - only allow for root users
    if (formData.relationshipType === 'sibling' && formData.linkedMemberId) {
      const selectedMember = existingMembers.find(m => m.id === formData.linkedMemberId);
      const isRootUser = selectedMember && selectedMember.root === true;
      
      if (!isRootUser) {
        const parents = existingMembers.filter(member => 
          member.childIds && member.childIds.includes(selectedMember.id)
        );
        
        setError(
          `Siblings can only be added to root family members. ` +
          (parents.length > 0 
            ? `To add a sibling to ${selectedMember.name}, select their parent${parents.length > 1 ? 's' : ''} instead: ${parents.map(p => p.name).join(' or ')}.`
            : `Please select a root family member or add as child to a parent.`
          )
        );
        setIsLoading(false);
        return;
      }
    }

    try {
      const memberData = {
        ...formData,
        birthDate: formData.birthDate ? new Date(formData.birthDate) : null,
        deathDate: formData.deathDate ? new Date(formData.deathDate) : null,
        linkedMemberId: formData.linkedMemberId.trim() || null,
        relationshipType: formData.relationshipType.trim() || null,
        imageUrl: imagePreview || formData.imageUrl || '', // Use uploaded image or fallback to URL if provided
      };

      console.log('🔍 Debug: Submitting member data:', memberData);
      console.log('🔍 Debug: Is first user:', isFirstUser);
      
      const id = await addFamilyMemberWithRelationships(memberData);
      
      console.log('🔍 Debug: Member added with ID:', id);
      
      // Test the relationship flow if there's a parent relationship
      if (memberData.linkedMemberId && memberData.relationshipType === 'parent') {
        const linkedMember = existingMembers.find(m => m.id === memberData.linkedMemberId);
        if (linkedMember) {
          console.log('🧪 Testing parent-child relationship...');
          setTimeout(async () => {
            await testRelationshipFlow(linkedMember.name, memberData.name);
          }, 1000); // Wait a second for the database to update
        }
      }
      
      // Reset form
      setFormData({
        name: '',
        birthDate: '',
        deathDate: '',
        gender: '',
        spouseId: '',
        notes: '',
        imageUrl: '',
        linkedMemberId: '',
        relationshipType: ''
      });
      setSelectedFile(null);
      setImagePreview(null);
      const fileInput = document.getElementById('imageFile');
      if (fileInput) {
        fileInput.value = '';
      }

      console.log('🔍 Debug: Calling onMemberAdded callback');
      if (onMemberAdded) {
        onMemberAdded({ id, ...memberData });
      } else {
        console.log('❌ Debug: onMemberAdded callback not provided');
      }
    } catch (err) {
      setError('Failed to add family member: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Additional validation for date fields
    if (name === 'birthDate' || name === 'deathDate') {
      const date = new Date(value);
      const year = date.getFullYear();
      
      // Validate year range (1800-current year)
      if (year < 1800 || year > new Date().getFullYear()) {
        return; // Don't update state with invalid date
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    // Reset the file input
    const fileInput = document.getElementById('imageFile');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span>👤</span>
              <span>Name *</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter full name"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="birthDate" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <span>🎂</span>
                <span>Birth Date</span>
              </label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                min="1800-01-01"
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              />
              <p className="text-xs text-gray-500">Valid range: 1800 - {new Date().getFullYear()}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="deathDate" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <span>🕊️</span>
                <span>Death Date</span>
              </label>
              <input
                type="date"
                id="deathDate"
                name="deathDate"
                value={formData.deathDate}
                onChange={handleChange}
                min={formData.birthDate || "1800-01-01"}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              />
              <p className="text-xs text-gray-500">
                {formData.birthDate 
                  ? `Must be after birth date (${new Date(formData.birthDate).toLocaleDateString()})` 
                  : `Valid range: 1800 - ${new Date().getFullYear()}`
                }
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="gender" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span>⚥</span>
              <span>Gender</span>
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span>📸</span>
              <span>Photo</span>
            </label>
            
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 rounded-xl object-cover border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="imageFile"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="imageFile"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">Click to upload photo</span>
                  <span className="text-xs text-gray-400">PNG, JPG up to 5MB</span>
                </label>
              </div>
            )}
            
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span>💡</span>
              <span>Optional - a beautiful default landscape will be used if no photo is uploaded</span>
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span>📝</span>
              <span>Notes & Stories</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Share memories, achievements, or stories about this person..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
            />
          </div>

          {!isFirstUser && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-4">
                <span>🔗</span>
                <span>Family Connection</span>
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="linkedMemberId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span>👥</span>
                    <span>Link to Existing Family Member *</span>
                  </label>
                  <select
                    id="linkedMemberId"
                    name="linkedMemberId"
                    value={formData.linkedMemberId}
                    onChange={handleChange}
                    required={!isFirstUser}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  >
                    <option value="">Select a family member</option>
                    {existingMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="relationshipType" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span>❤️</span>
                    <span>Relationship Type *</span>
                  </label>
                  <select
                    id="relationshipType"
                    name="relationshipType"
                    value={formData.relationshipType}
                    onChange={handleChange}
                    disabled={!formData.linkedMemberId}
                    required={!isFirstUser}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select relationship type</option>
                    <option value="spouse">💑 Spouse</option>
                    <option value="parent">👨‍👩‍👧‍👦 Parent</option>
                    {formData.linkedMemberId && (() => {
                      const selectedMember = existingMembers.find(m => m.id === formData.linkedMemberId);
                      const hasSpouse = selectedMember?.spouseId;
                      return hasSpouse ? (
                        <option value="child">👶 Child</option>
                      ) : (
                        <option value="child" disabled>👶 Child (requires spouse first)</option>
                      );
                    })()}
                    {formData.linkedMemberId && (() => {
                      const selectedMember = existingMembers.find(m => m.id === formData.linkedMemberId);
                      const isRootUser = selectedMember && selectedMember.root === true;
                      
                      return isRootUser ? (
                        <option value="sibling">👫 Sibling</option>
                      ) : (
                        <option value="sibling" disabled>👫 Sibling (only available for root users)</option>
                      );
                    })()}
                  </select>
                  
                  {formData.relationshipType === 'spouse' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
                      <p className="text-xs text-orange-800 flex items-center gap-2">
                        <span>💡</span>
                        <span>When adding a spouse, you can later add their parents and children</span>
                      </p>
                    </div>
                  )}
                  
                  {formData.relationshipType === 'parent' && formData.linkedMemberId && (() => {
                    const selectedMember = existingMembers.find(m => m.id === formData.linkedMemberId);
                    const existingParents = existingMembers.filter(member => 
                      member.childIds && member.childIds.includes(selectedMember.id)
                    );
                    
                    if (existingParents.length > 0) {
                      return (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                          <p className="text-xs text-blue-800 flex items-center gap-2">
                            <span>🔄</span>
                            <span>
                              {selectedMember.name} already has parent{existingParents.length > 1 ? 's' : ''}: {existingParents.map(p => p.name).join(', ')}. 
                              This person will be added as a spouse to {existingParents[0].name} instead.
                            </span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {formData.relationshipType === 'child' && formData.linkedMemberId && (() => {
                    const selectedMember = existingMembers.find(m => m.id === formData.linkedMemberId);
                    const hasSpouse = selectedMember?.spouseId;
                    if (!hasSpouse) {
                      return (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                          <p className="text-xs text-red-800 flex items-center gap-2">
                            <span>⚠️</span>
                            <span>Cannot add a child to a user without a spouse. Please add a spouse first.</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {formData.linkedMemberId && (() => {
                    const selectedMember = existingMembers.find(m => m.id === formData.linkedMemberId);
                    const isRootUser = selectedMember && selectedMember.root === true;
                    
                    if (!isRootUser && selectedMember) {
                      // Find the parent(s) if they exist
                      const parents = existingMembers.filter(member => 
                        member.childIds && member.childIds.includes(selectedMember.id)
                      );
                      
                      return (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                          <p className="text-xs text-blue-800 flex items-center gap-2">
                            <span>💡</span>
                            <span>
                              Siblings can only be added to root family members. 
                              {parents.length > 0 
                                ? ` To add a sibling to ${selectedMember.name}, select their parent${parents.length > 1 ? 's' : ''} instead: ${parents.map(p => p.name).join(' or ')}`
                                : ` To add siblings, select a root family member or add them as children to a parent.`
                              }
                            </span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          )}

      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeOpacity="0.3"/>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span>Adding...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>{isFirstUser ? 'Create First Member' : 'Add Family Member'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
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

    // Validate sibling relationship
    if (formData.relationshipType === 'sibling' && formData.linkedMemberId) {
      const selectedMember = existingMembers.find(m => m.id === formData.linkedMemberId);
      const hasParent = selectedMember && (
        selectedMember.parentId || 
        existingMembers.some(member => 
          member.childIds && member.childIds.includes(selectedMember.id)
        )
      );
      
      if (hasParent) {
        const parents = existingMembers.filter(member => 
          member.childIds && member.childIds.includes(selectedMember.id)
        );
        
        setError(
          `Cannot add sibling to ${selectedMember.name} who already has parents. ` +
          `Please select their parent${parents.length > 1 ? 's' : ''} instead: ` +
          `${parents.length > 0 ? parents.map(p => p.name).join(' or ') : 'their parent'}.`
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <h2 className="text-xl font-bold text-white">Add New Family Member</h2>
          </div>
          <p className="text-blue-100 text-sm mt-1">
            {isFirstUser ? "Create the first member of your family tree" : "Add a new family member and their relationship"}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
      
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
            <label htmlFor="imageUrl" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span>📸</span>
              <span>Photo URL</span>
            </label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/photo.jpg"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
            />
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span>💡</span>
              <span>Optional - leave empty for a beautiful default landscape</span>
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
                      const hasParent = selectedMember && (
                        // Check if this member has a parentId OR if they're in someone's childIds
                        selectedMember.parentId || 
                        existingMembers.some(member => 
                          member.childIds && member.childIds.includes(selectedMember.id)
                        )
                      );
                      return hasParent ? (
                        <option value="sibling" disabled>👫 Sibling (link to their parent instead)</option>
                      ) : (
                        <option value="sibling">👫 Sibling</option>
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
                    const hasParent = selectedMember && (
                      selectedMember.parentId || 
                      existingMembers.some(member => 
                        member.childIds && member.childIds.includes(selectedMember.id)
                      )
                    );
                    
                    if (hasParent) {
                      // Find the parent(s)
                      const parents = existingMembers.filter(member => 
                        member.childIds && member.childIds.includes(selectedMember.id)
                      );
                      
                      return (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                          <p className="text-xs text-blue-800 flex items-center gap-2">
                            <span>💡</span>
                            <span>
                              To add a sibling to {selectedMember.name}, select their parent{parents.length > 1 ? 's' : ''} instead: 
                              {parents.length > 0 
                                ? parents.map(p => p.name).join(' or ') 
                                : 'their parent'
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
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
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
      </div>
    </div>
  );
}
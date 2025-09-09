'use client';

import { useState, useEffect } from 'react';
import { addFamilyMemberWithRelationships, getAllFamilyMembers, testRelationshipFlow } from '@/lib/firestore';
import AutoComplete from './AutoComplete';

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
        const parents = selectedMember.parentIds && selectedMember.parentIds.length > 0 
          ? existingMembers.filter(member => selectedMember.parentIds.includes(member.id))
          : [];
        
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
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
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
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
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
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
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
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span>Gender</span>
            </label>
            <AutoComplete
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' }
              ]}
              value={formData.gender}
              onSelect={(value) => handleChange({ target: { name: 'gender', value } })}
              placeholder="Select or type gender"
              displayKey="label"
              valueKey="value"
              icon={<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
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
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-airbnb shadow-airbnb hover:shadow-airbnb-hover"
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
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>Optional - a beautiful default landscape will be used if no photo is uploaded</span>
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
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
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>Family Connection</span>
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="linkedMemberId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Link to Existing Family Member *</span>
                  </label>
                  <AutoComplete
                    options={existingMembers}
                    value={formData.linkedMemberId}
                    onSelect={(value) => handleChange({ target: { name: 'linkedMemberId', value } })}
                    placeholder="Type to search family members..."
                    displayKey="name"
                    valueKey="id"
                    required={!isFirstUser}
                    icon={<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>}
                    renderOption={(member, isHighlighted) => (
                      <div className={`flex items-center gap-2 ${isHighlighted ? 'text-blue-700' : 'text-gray-900'}`}>
                        {member.root ? (
                          <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                        <span>{member.name}</span>
                        {member.gender && (
                          <span className="text-xs text-gray-500 ml-auto">
                            {member.gender === 'male' ? '♂' : member.gender === 'female' ? '♀' : '⚥'}
                          </span>
                        )}
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="relationshipType" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>Relationship Type *</span>
                  </label>
                  <AutoComplete
                    options={(() => {
                      const baseOptions = [
                        { value: 'spouse', label: 'Spouse', enabled: true },
                        { value: 'parent', label: 'Parent', enabled: true }
                      ];
                      
                      if (formData.linkedMemberId) {
                        const selectedMember = existingMembers.find(m => m.id === formData.linkedMemberId);
                        const hasSpouse = selectedMember?.spouseId;
                        const isRootUser = selectedMember && selectedMember.root === true;
                        
                        baseOptions.push({
                          value: 'child',
                          label: hasSpouse ? 'Child' : 'Child (requires spouse first)',
                          enabled: hasSpouse
                        });
                        
                        baseOptions.push({
                          value: 'sibling',
                          label: isRootUser ? 'Sibling' : 'Sibling (only available for root users)',
                          enabled: isRootUser
                        });
                      }
                      
                      return baseOptions;
                    })()}
                    value={formData.relationshipType}
                    onSelect={(value, option) => {
                      if (option.enabled) {
                        handleChange({ target: { name: 'relationshipType', value } });
                      }
                    }}
                    placeholder="Select relationship type..."
                    displayKey="label"
                    valueKey="value"
                    disabled={!formData.linkedMemberId}
                    required={!isFirstUser}
                    icon={<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>}
                    renderOption={(option, isHighlighted) => (
                      <div className={`flex items-center justify-between ${
                        !option.enabled 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : isHighlighted 
                          ? 'text-blue-700' 
                          : 'text-gray-900'
                      }`}>
                        <span>{option.label}</span>
                        {!option.enabled && (
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                          </svg>
                        )}
                      </div>
                    )}
                    filterFunction={(options, input) => {
                      return options.filter(option =>
                        option.label.toLowerCase().includes(input.toLowerCase())
                      );
                    }}
                  />
                  
                  {formData.relationshipType === 'spouse' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
                      <p className="text-xs text-orange-800 flex items-center gap-2">
                        <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span>When adding a spouse, you can later add their parents and children</span>
                      </p>
                    </div>
                  )}
                  
                  {formData.relationshipType === 'parent' && formData.linkedMemberId && (() => {
                    const selectedMember = existingMembers.find(m => m.id === formData.linkedMemberId);
                    const existingParents = selectedMember.parentIds && selectedMember.parentIds.length > 0 
                      ? existingMembers.filter(member => selectedMember.parentIds.includes(member.id))
                      : [];
                    
                    if (existingParents.length > 0) {
                      return (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                          <p className="text-xs text-blue-800 flex items-center gap-2">
                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
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
                            <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
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
                      // Find the real parent(s) if they exist (exclude dummy parents)
                      const parents = selectedMember.parentIds && selectedMember.parentIds.length > 0 
                        ? existingMembers.filter(member => 
                            selectedMember.parentIds.includes(member.id) && 
                            !member.id.startsWith('dummy_parent_')
                          )
                        : [];
                      
                      return (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                          <p className="text-xs text-blue-800 flex items-center gap-2">
                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
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
          className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-airbnb-rausch text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-airbnb font-medium shadow-airbnb hover:shadow-airbnb-hover"
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
              <span>{isFirstUser ? 'Create First Member' : 'Add Family Member'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
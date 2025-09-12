'use client';

import { useState, useEffect } from 'react';
import { addFamilyMemberWithRelationships, getAllFamilyMembers, testRelationshipFlow } from '@/lib/firestore';
import { uploadProfileImage, uploadGalleryImages, validateImageFile, validateImageFiles, createImagePreview } from '@/lib/imageUpload';
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
  const [selectedProfileFile, setSelectedProfileFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [selectedGalleryFiles, setSelectedGalleryFiles] = useState([]);
  const [galleryImagePreviews, setGalleryImagePreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ profile: 0, gallery: 0 });
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
      // Create temporary member ID for file uploads
      const tempMemberId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      let profileImageUrl = formData.imageUrl || '';
      let galleryImageUrls = [];
      
      // Upload profile image if selected
      if (selectedProfileFile) {
        setUploadProgress(prev => ({ ...prev, profile: 10 }));
        console.log('📸 Uploading profile image...');
        const profileResult = await uploadProfileImage(selectedProfileFile, tempMemberId);
        profileImageUrl = profileResult.url;
        setUploadProgress(prev => ({ ...prev, profile: 100 }));
        console.log('✅ Profile image uploaded:', profileResult.url);
      }
      
      // Upload gallery images if selected
      if (selectedGalleryFiles.length > 0) {
        setUploadProgress(prev => ({ ...prev, gallery: 10 }));
        console.log('📸 Uploading gallery images...');
        const galleryResults = await uploadGalleryImages(selectedGalleryFiles, tempMemberId);
        galleryImageUrls = galleryResults;
        setUploadProgress(prev => ({ ...prev, gallery: 100 }));
        console.log('✅ Gallery images uploaded:', galleryResults.length, 'images');
      }
      
      const memberData = {
        ...formData,
        birthDate: formData.birthDate ? new Date(formData.birthDate) : null,
        deathDate: formData.deathDate ? new Date(formData.deathDate) : null,
        linkedMemberId: formData.linkedMemberId.trim() || null,
        relationshipType: formData.relationshipType.trim() || null,
        imageUrl: profileImageUrl,
        galleryImages: galleryImageUrls,
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
      setSelectedProfileFile(null);
      setProfileImagePreview(null);
      setSelectedGalleryFiles([]);
      setGalleryImagePreviews([]);
      setUploadProgress({ profile: 0, gallery: 0 });
      const profileInput = document.getElementById('profileImageFile');
      const galleryInput = document.getElementById('galleryImageFiles');
      if (profileInput) {
        profileInput.value = '';
      }
      if (galleryInput) {
        galleryInput.value = '';
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

  const handleProfileFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Profile image file size must be less than 5MB');
        return;
      }
      
      setSelectedProfileFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryFilesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Validate each file
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          setError('Please select only image files');
          return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
          setError('Each image file must be less than 5MB');
          return;
        }
      }
      
      // Limit to 10 images max
      if (files.length > 10) {
        setError('You can upload a maximum of 10 images');
        return;
      }
      
      setSelectedGalleryFiles(files);
      
      // Create previews for all files
      const previews = [];
      let loadedCount = 0;
      
      files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews[index] = reader.result;
          loadedCount++;
          
          if (loadedCount === files.length) {
            setGalleryImagePreviews(previews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeProfileImage = () => {
    setSelectedProfileFile(null);
    setProfileImagePreview(null);
    // Reset the file input
    const fileInput = document.getElementById('profileImageFile');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const removeGalleryImage = (index) => {
    const newFiles = selectedGalleryFiles.filter((_, i) => i !== index);
    const newPreviews = galleryImagePreviews.filter((_, i) => i !== index);
    setSelectedGalleryFiles(newFiles);
    setGalleryImagePreviews(newPreviews);
    
    // If no files left, reset the input
    if (newFiles.length === 0) {
      const galleryInput = document.getElementById('galleryImageFiles');
      if (galleryInput) {
        galleryInput.value = '';
      }
    }
  };

  const removeAllGalleryImages = () => {
    setSelectedGalleryFiles([]);
    setGalleryImagePreviews([]);
    const galleryInput = document.getElementById('galleryImageFiles');
    if (galleryInput) {
      galleryInput.value = '';
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

          <div className="space-y-6">
            {/* Profile Picture Section */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile Picture</span>
              </label>
              
              {profileImagePreview ? (
                <div className="relative">
                  <img
                    src={profileImagePreview}
                    alt="Profile Preview"
                    className="w-32 h-32 rounded-xl object-cover border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeProfileImage}
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
                    id="profileImageFile"
                    accept="image/*"
                    onChange={handleProfileFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="profileImageFile"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600">Click to upload profile picture</span>
                    <span className="text-xs text-gray-400">Images up to 10MB (auto-compressed)</span>
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

            {/* Gallery Images Section */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Additional Photos</span>
              </label>
              
              {galleryImagePreviews.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {galleryImagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Gallery Preview ${index + 1}`}
                          className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-airbnb shadow-airbnb hover:shadow-airbnb-hover"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={removeAllGalleryImages}
                    className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove all images
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="galleryImageFiles"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryFilesChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="galleryImageFiles"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600">Click to upload additional photos</span>
                    <span className="text-xs text-gray-400">Multiple images up to 10MB each (max 10, auto-compressed)</span>
                  </label>
                </div>
              )}
              
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Optional - share additional memories and moments</span>
              </p>
            </div>
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
              <span>
                {uploadProgress.profile > 0 && uploadProgress.profile < 100 ? 'Uploading profile image...' :
                 uploadProgress.gallery > 0 && uploadProgress.gallery < 100 ? 'Uploading gallery images...' :
                 'Adding member...'}
              </span>
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
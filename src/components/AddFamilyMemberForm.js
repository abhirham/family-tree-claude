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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Add Family Member</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
          Birth Date
        </label>
        <input
          type="date"
          id="birthDate"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="deathDate" className="block text-sm font-medium text-gray-700">
          Death Date (if applicable)
        </label>
        <input
          type="date"
          id="deathDate"
          name="deathDate"
          value={formData.deathDate}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
          Gender
        </label>
        <select
          id="gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
          Photo URL
        </label>
        <input
          type="url"
          id="imageUrl"
          name="imageUrl"
          value={formData.imageUrl}
          onChange={handleChange}
          placeholder="https://example.com/photo.jpg"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter a URL to a photo (optional)
        </p>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="linkedMemberId" className="block text-sm font-medium text-gray-700">
          Link to Existing Family Member {!isFirstUser && <span className="text-red-500">*</span>}
          {isFirstUser && <span className="text-gray-500">(optional for first user)</span>}
        </label>
        <select
          id="linkedMemberId"
          name="linkedMemberId"
          value={formData.linkedMemberId}
          onChange={handleChange}
          required={!isFirstUser}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a family member</option>
          {existingMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Select an existing family member to establish a relationship (optional)
        </p>
      </div>

      <div>
        <label htmlFor="relationshipType" className="block text-sm font-medium text-gray-700">
          Relationship Type {!isFirstUser && <span className="text-red-500">*</span>}
          {isFirstUser && <span className="text-gray-500">(optional for first user)</span>}
        </label>
        <select
          id="relationshipType"
          name="relationshipType"
          value={formData.relationshipType}
          onChange={handleChange}
          disabled={!formData.linkedMemberId}
          required={!isFirstUser}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select relationship type</option>
          <option value="spouse">Spouse</option>
          <option value="parent">Parent</option>
          {formData.linkedMemberId && (() => {
            const selectedMember = existingMembers.find(m => m.id === formData.linkedMemberId);
            const hasSpouse = selectedMember?.spouseId;
            return hasSpouse ? (
              <option value="child">Child</option>
            ) : (
              <option value="child" disabled>Child (requires spouse first)</option>
            );
          })()}
          <option value="sibling">Sibling</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Define how this person relates to the selected family member
        </p>
        {formData.relationshipType === 'spouse' && (
          <p className="text-xs text-orange-600 mt-1 font-medium">
            Note: When adding a spouse, you can only add their parents as new family members
          </p>
        )}
        {formData.relationshipType === 'child' && formData.linkedMemberId && (() => {
          const selectedMember = existingMembers.find(m => m.id === formData.linkedMemberId);
          const hasSpouse = selectedMember?.spouseId;
          if (!hasSpouse) {
            return (
              <p className="text-xs text-red-600 mt-1 font-medium">
                Cannot add a child to a user without a spouse. Please add a spouse first.
              </p>
            );
          }
          return null;
        })()}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isLoading ? 'Adding...' : 'Add Family Member'}
      </button>
    </form>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { getAllFamilyMembers } from '@/lib/firestore';
import Image from 'next/image';

function FamilyMemberCard({ member }) {
  const birthYear = member.birthDate ? new Date(member.birthDate.seconds * 1000).getFullYear() : '';
  const deathYear = member.deathDate ? new Date(member.deathDate.seconds * 1000).getFullYear() : '';
  
  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow min-w-[200px]">
      <div className="flex flex-col items-center mb-3">
        {member.imageUrl ? (
          <Image
            src={member.imageUrl}
            alt={member.name}
            width={80}
            height={80}
            className="rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
            <span className="text-gray-500 text-xs">No Photo</span>
          </div>
        )}
      </div>
      
      <h3 className="font-bold text-lg text-gray-800 text-center">{member.name}</h3>
      <div className="text-sm text-gray-600 mt-2 text-center">
        {birthYear && (
          <p>Born: {birthYear}</p>
        )}
        {deathYear && (
          <p>Died: {deathYear}</p>
        )}
        {member.gender && (
          <p className="capitalize">{member.gender}</p>
        )}
      </div>
      {member.notes && (
        <p className="text-xs text-gray-500 mt-2 italic text-center">{member.notes}</p>
      )}
    </div>
  );
}

export default function FamilyTree() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const familyMembers = await getAllFamilyMembers();
        setMembers(familyMembers);
      } catch (err) {
        setError('Failed to load family members: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading family tree...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
        {error}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-600 mb-4">No family members yet</h2>
        <p className="text-gray-500">Add your first family member to get started!</p>
      </div>
    );
  }

  // Simple grid layout for now - can be enhanced later with actual tree structure
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-center mb-8">Family Tree</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {members.map((member) => (
          <FamilyMemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { getAllFamilyMembers } from '@/lib/firestore';
import Image from 'next/image';

function FamilyMemberCard({ member, onClick, isSelected = false }) {
  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    const date = dateObj.seconds ? new Date(dateObj.seconds * 1000) : new Date(dateObj);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  return (
    <div 
      className={`bg-white border-2 rounded-lg p-4 shadow-md hover:shadow-lg transition-all cursor-pointer min-w-[200px] ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
      onClick={() => onClick(member)}
    >
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
      <p className="text-xs text-gray-400 text-center mt-1 font-mono">ID: {member.id}</p>
      {member.parentId && (
        <p className="text-xs text-orange-400 text-center font-mono">ParentID: {member.parentId}</p>
      )}
      {member.childIds && member.childIds.length > 0 && (
        <p className="text-xs text-green-400 text-center font-mono">Children: {member.childIds.length}</p>
      )}
      <div className="text-sm text-gray-600 mt-2 text-center">
        {member.birthDate && (
          <p>Born: {formatDate(member.birthDate)}</p>
        )}
        {member.deathDate && (
          <p>Died: {formatDate(member.deathDate)}</p>
        )}
        {member.gender && (
          <p className="capitalize mt-1">{member.gender}</p>
        )}
      </div>
      
      {member.notes && (
        <p className="text-xs text-gray-500 mt-2 italic text-center">{member.notes}</p>
      )}
    </div>
  );
}

function NavigationStack({ stack, onNavigateToMember, onClearStack }) {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Navigation</h3>
        {stack.length > 0 && (
          <button
            onClick={onClearStack}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear
          </button>
        )}
      </div>
      
      {stack.length === 0 ? (
        <p className="text-sm text-gray-500">Click on family members to navigate</p>
      ) : (
        <div className="space-y-2">
          {stack.map((member, index) => (
            <div
              key={`${member.id}-${index}`}
              className="flex items-center space-x-2 p-2 bg-white rounded border cursor-pointer hover:bg-gray-50"
              onClick={() => onNavigateToMember(member, index)}
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0">
                {member.imageUrl ? (
                  <Image
                    src={member.imageUrl}
                    alt={member.name}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-300"></div>
                )}
              </div>
              <span className="text-sm font-medium text-gray-800 truncate">{member.name}</span>
              {index === stack.length - 1 && (
                <span className="text-xs text-blue-600">Current</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FamilyTree() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [navigationStack, setNavigationStack] = useState([]);
  const [currentPerson, setCurrentPerson] = useState(null);
  const [displayedMembers, setDisplayedMembers] = useState([]);
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const familyMembers = await getAllFamilyMembers();
        setMembers(familyMembers);
        
        // Show root members initially (members with root=true)
        const rootMembers = familyMembers.filter(member => member.root === true);
        
        console.log('🔍 Debug: All family members:', familyMembers);
        console.log('🔍 Debug: Root members:', rootMembers);
        console.log('🔍 Debug: Setting displayed members to:', rootMembers.length);
        
        setDisplayedMembers(rootMembers);
      } catch (err) {
        setError('Failed to load family members: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const getRelatedMembers = (person) => {
    const related = new Set();
    const relatedWithTypes = [];

    // Handle different relationship types based on person's structure
    
    // If person has parentId (they're in a sibling group)
    if (person.parentId) {
      // Add siblings (others with same parentId)
      const siblings = members.filter(member => 
        member.id !== person.id &&
        member.parentId === person.parentId
      );
      
      siblings.forEach(sibling => {
        related.add(sibling.id);
        relatedWithTypes.push({ member: sibling, type: 'Sibling' });
      });
    }

    // If person has childIds (they're a parent)
    if (person.childIds && person.childIds.length > 0) {
      person.childIds.forEach(childId => {
        const child = members.find(m => m.id === childId);
        if (child) {
          related.add(child.id);
          relatedWithTypes.push({ member: child, type: 'Child' });
        }
      });
    }

    // Find parents (people who have this person in their childIds)
    const parents = members.filter(member => 
      member.childIds && member.childIds.includes(person.id)
    );
    parents.forEach(parent => {
      related.add(parent.id);
      relatedWithTypes.push({ member: parent, type: 'Parent' });
    });

    // Add spouse
    if (person.spouseId) {
      const spouse = members.find(m => m.id === person.spouseId);
      if (spouse) {
        related.add(spouse.id);
        relatedWithTypes.push({ member: spouse, type: 'Spouse' });
        
        // Also include spouse's children as step-children if they're not already included
        if (spouse.childIds) {
          spouse.childIds.forEach(childId => {
            if (!related.has(childId) && childId !== person.id) {
              const child = members.find(m => m.id === childId);
              if (child) {
                related.add(child.id);
                relatedWithTypes.push({ member: child, type: 'Step-Child' });
              }
            }
          });
        }
      }
    }

    // Also find if this person is someone else's spouse
    const spouseOfMember = members.find(member => member.spouseId === person.id);
    if (spouseOfMember && !related.has(spouseOfMember.id)) {
      related.add(spouseOfMember.id);
      relatedWithTypes.push({ member: spouseOfMember, type: 'Spouse' });
      
      // Include spouse's children as step-children if they're not already included
      if (spouseOfMember.childIds) {
        spouseOfMember.childIds.forEach(childId => {
          if (!related.has(childId) && childId !== person.id) {
            const child = members.find(m => m.id === childId);
            if (child) {
              related.add(child.id);
              relatedWithTypes.push({ member: child, type: 'Step-Child' });
            }
          }
        });
      }
    }

    return relatedWithTypes;
  };

  const getReverseRelationship = (relationshipType) => {
    const reverseMap = {
      'parent': 'Child',
      'child': 'Parent',
      'spouse': 'Spouse',
      'sibling': 'Sibling'
    };
    return reverseMap[relationshipType];
  };

  const handleMemberClick = (member) => {
    const relatedMembers = getRelatedMembers(member);
    setCurrentPerson(member);
    setDisplayedMembers([member, ...relatedMembers.map(r => r.member)]);
    
    // Add to navigation stack
    setNavigationStack(prev => [...prev, member]);
  };

  const handleNavigateFromStack = (member, index) => {
    const relatedMembers = getRelatedMembers(member);
    setCurrentPerson(member);
    setDisplayedMembers([member, ...relatedMembers.map(r => r.member)]);
    
    // Trim navigation stack to the clicked position
    setNavigationStack(prev => prev.slice(0, index + 1));
  };

  const handleClearStack = () => {
    setNavigationStack([]);
    setCurrentPerson(null);
    
    // Show root members again
    const rootMembers = members.filter(member => member.root === true);
    setDisplayedMembers(rootMembers);
  };

  const handleSearchA = () => {
    if (!searchA.trim()) return;
    
    const foundMember = members.find(member => 
      member.name.toLowerCase().includes(searchA.toLowerCase())
    );
    
    if (foundMember) {
      setNavigationStack([]);
      handleMemberClick(foundMember);
    } else {
      alert('Person not found');
    }
  };

  const findPath = (startId, endId, visited = new Set()) => {
    if (startId === endId) return [startId];
    if (visited.has(startId)) return null;
    
    visited.add(startId);
    const startMember = members.find(m => m.id === startId);
    if (!startMember) return null;
    
    const connections = getRelatedMembers(startMember).map(r => r.member.id);
    
    for (const connectionId of connections) {
      const path = findPath(connectionId, endId, new Set(visited));
      if (path) {
        return [startId, ...path];
      }
    }
    
    return null;
  };

  const handleSearchPath = () => {
    if (!searchA.trim() || !searchB.trim()) return;
    
    const memberA = members.find(member => 
      member.name.toLowerCase().includes(searchA.toLowerCase())
    );
    const memberB = members.find(member => 
      member.name.toLowerCase().includes(searchB.toLowerCase())
    );
    
    if (!memberA || !memberB) {
      alert('One or both persons not found');
      return;
    }
    
    const path = findPath(memberA.id, memberB.id);
    if (path) {
      const pathMembers = path.map(id => members.find(m => m.id === id)).filter(Boolean);
      setNavigationStack(pathMembers);
      setCurrentPerson(memberB);
      setDisplayedMembers([memberB]);
    } else {
      alert('No path found between the two people');
    }
  };

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

  return (
    <div className="flex h-screen">
      {/* Left Sidebar - Navigation Stack */}
      <NavigationStack 
        stack={navigationStack}
        onNavigateToMember={handleNavigateFromStack}
        onClearStack={handleClearStack}
      />
      
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Search Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Person (A)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchA}
                  onChange={(e) => setSearchA(e.target.value)}
                  placeholder="Enter name to search"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchA()}
                />
                <button
                  onClick={handleSearchA}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Find
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Find Path to Person (B)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchB}
                  onChange={(e) => setSearchB(e.target.value)}
                  placeholder="Enter name to find path"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchPath()}
                />
                <button
                  onClick={handleSearchPath}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Path
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Family Tree Display */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {displayedMembers.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-600 mb-4">No family members yet</h2>
              <p className="text-gray-500">Add your first family member to get started!</p>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-center mb-2">Family Tree</h2>
              
              {currentPerson ? (
                <p className="text-center text-gray-600 mb-6">
                  Showing connections for <strong>{currentPerson.name}</strong>
                </p>
              ) : (
                <p className="text-center text-gray-600 mb-6">
                  Root family members (click to explore connections)
                </p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedMembers.map((member) => (
                  <FamilyMemberCard 
                    key={member.id} 
                    member={member} 
                    onClick={handleMemberClick}
                    isSelected={currentPerson?.id === member.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
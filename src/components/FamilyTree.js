'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { getAllFamilyMembers } from '@/lib/firestore';
import PersonCard from './PersonCard';
import RelationshipSection from './RelationshipSection';

function NavigationStack({ stack, onNavigateToMember, onClearStack }) {
  return (
    <div className="w-72 bg-white border-r border-gray-200 p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌳</span>
          <h3 className="font-semibold text-gray-800">Family Tree</h3>
        </div>
        {stack.length > 0 && (
          <button
            onClick={onClearStack}
            className="text-sm text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full transition-colors"
          >
            Reset
          </button>
        )}
      </div>
      
      {stack.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">👥</div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Click on family members to explore connections and build your navigation history
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Navigation History</h4>
          {stack.map((member, index) => (
            <div
              key={`${member.id}-${index}`}
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                index === stack.length - 1 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
              }`}
              onClick={() => onNavigateToMember(member, index)}
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                {member.imageUrl ? (
                  <PersonCard member={member} onClick={() => {}} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-800 truncate block">{member.name}</span>
                <span className="text-xs text-gray-500">Step {index + 1}</span>
              </div>
              {index === stack.length - 1 && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Current</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const FamilyTree = forwardRef((props, ref) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [navigationStack, setNavigationStack] = useState([]);
  const [currentPerson, setCurrentPerson] = useState(null);
  const [displayedMembers, setDisplayedMembers] = useState([]);
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');

  useImperativeHandle(ref, () => ({
    handleSearchA: (searchTerm) => {
      if (!searchTerm.trim()) return;
      
      const foundMember = members.find(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (foundMember) {
        setNavigationStack([]);
        handleMemberClick(foundMember);
      } else {
        alert('Person not found');
      }
    },
    handleSearchPath: (searchTermA, searchTermB) => {
      if (!searchTermA.trim() || !searchTermB.trim()) return;
      
      const memberA = members.find(member => 
        member.name.toLowerCase().includes(searchTermA.toLowerCase())
      );
      const memberB = members.find(member => 
        member.name.toLowerCase().includes(searchTermB.toLowerCase())
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
    }
  }));

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

  const groupRelatedMembers = (relatedMembers) => {
    const groups = {
      spouses: [],
      children: [],
      parents: [],
      siblings: [],
      stepChildren: []
    };

    relatedMembers.forEach(item => {
      switch (item.type) {
        case 'Spouse':
          groups.spouses.push(item);
          break;
        case 'Child':
          groups.children.push(item);
          break;
        case 'Step-Child':
          groups.stepChildren.push(item);
          break;
        case 'Parent':
          groups.parents.push(item);
          break;
        case 'Sibling':
          groups.siblings.push(item);
          break;
      }
    });

    return groups;
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

        {/* Family Tree Display */}
        <div className="max-w-6xl mx-auto">
          {displayedMembers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-6">🌳</div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Family Tree Awaits</h2>
              <p className="text-gray-600 text-lg mb-6">Start building your family history by adding your first family member</p>
              <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                <span>✨</span>
                <span>Click "Add Family Member" above to begin</span>
              </div>
            </div>
          ) : currentPerson ? (
            <div>
              {/* Hero Section for Selected Person */}
              <PersonCard 
                member={currentPerson} 
                onClick={() => {}}
                isHero={true}
              />
              
              {/* Related Members by Relationship */}
              {(() => {
                const relatedMembers = getRelatedMembers(currentPerson);
                const groups = groupRelatedMembers(relatedMembers);
                
                return (
                  <div className="space-y-8">
                    <RelationshipSection
                      title="Spouse"
                      members={groups.spouses}
                      onMemberClick={handleMemberClick}
                      currentPerson={currentPerson}
                      icon="💑"
                    />
                    
                    <RelationshipSection
                      title="Children"
                      members={groups.children}
                      onMemberClick={handleMemberClick}
                      currentPerson={currentPerson}
                      icon="👶"
                    />
                    
                    <RelationshipSection
                      title="Step Children"
                      members={groups.stepChildren}
                      onMemberClick={handleMemberClick}
                      currentPerson={currentPerson}
                      icon="👦"
                    />
                    
                    <RelationshipSection
                      title="Parents"
                      members={groups.parents}
                      onMemberClick={handleMemberClick}
                      currentPerson={currentPerson}
                      icon="👨‍👩‍👧‍👦"
                    />
                    
                    <RelationshipSection
                      title="Siblings"
                      members={groups.siblings}
                      onMemberClick={handleMemberClick}
                      currentPerson={currentPerson}
                      icon="👫"
                    />
                  </div>
                );
              })()}
            </div>
          ) : (
            <div>
              {/* Root Members Display */}
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Family Tree</h2>
                  <p className="text-gray-600">
                    Root family members - click on anyone to explore their connections
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {displayedMembers.map((member) => (
                    <PersonCard
                      key={member.id} 
                      member={member} 
                      onClick={handleMemberClick}
                      isSelected={false}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

FamilyTree.displayName = 'FamilyTree';
export default FamilyTree;
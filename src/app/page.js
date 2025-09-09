'use client';

import { useState, useRef, useEffect } from 'react';
import FamilyTree from '@/components/FamilyTree';
import AddFamilyMemberForm from '@/components/AddFamilyMemberForm';
import Modal from '@/components/Modal';
import AutoComplete from '@/components/AutoComplete';
import { getAllFamilyMembers } from '@/lib/firestore';

export default function Home() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshTree, setRefreshTree] = useState(0);
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  const [familyMembers, setFamilyMembers] = useState([]);
  const familyTreeRef = useRef(null);

  // Fetch family members for search autocomplete
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const members = await getAllFamilyMembers();
        setFamilyMembers(members);
      } catch (error) {
        console.error('Error fetching family members for search:', error);
      }
    };
    
    fetchMembers();
  }, [refreshTree]); // Refresh when tree updates

  const handleMemberAdded = (memberData) => {
    console.log('Debug: handleMemberAdded called with:', memberData);
    console.log('Debug: Refreshing tree, current refreshTree:', refreshTree);
    setRefreshTree(prev => {
      console.log('Debug: Setting refreshTree from', prev, 'to', prev + 1);
      return prev + 1;
    });
    setShowAddForm(false);
    console.log('Debug: Form closed, tree should refresh');
  };

  const handleSearchA = (searchValue = searchA) => {
    if (familyTreeRef.current && familyTreeRef.current.handleSearchA) {
      // If searchValue is an ID (from autocomplete), find the member name
      const member = familyMembers.find(m => m.id === searchValue);
      const searchTerm = member ? member.name : searchValue;
      familyTreeRef.current.handleSearchA(searchTerm);
    }
  };

  const handleSearchPath = (searchValueA = searchA, searchValueB = searchB) => {
    if (familyTreeRef.current && familyTreeRef.current.handleSearchPath) {
      // Convert IDs to names if needed
      const memberA = familyMembers.find(m => m.id === searchValueA);
      const memberB = familyMembers.find(m => m.id === searchValueB);
      const searchTermA = memberA ? memberA.name : searchValueA;
      const searchTermB = memberB ? memberB.name : searchValueB;
      familyTreeRef.current.handleSearchPath(searchTermA, searchTermB);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Fixed Top Bar */}
      <header className="sticky top-0 z-30 bg-white shadow-airbnb border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Title */}
            <div className="flex items-center min-w-0 flex-1">
              <h1 className="text-2xl font-semibold text-gray-900 truncate">
                Family Lineage
              </h1>
            </div>


            {/* Add Family Member Button */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-airbnb whitespace-nowrap flex-shrink-0 ${
                showAddForm 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300' 
                  : 'bg-airbnb-rausch text-white hover:bg-red-600 shadow-airbnb hover:shadow-airbnb-hover'
              }`}
            >
              {showAddForm ? (
                <>
                  <span>×</span>
                  <span>Close</span>
                </>
              ) : (
                <>
                  <span>Add Member</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <FamilyTree 
          key={refreshTree} 
          ref={familyTreeRef}
          familyMembers={familyMembers}
          searchA={searchA}
          setSearchA={setSearchA}
          searchB={searchB}
          setSearchB={setSearchB}
          onSearchA={handleSearchA}
          onSearchPath={handleSearchPath}
        />
      </main>

      <Modal 
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          title="Add New Family Member"
        >
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <p className="text-gray-700 text-sm">
              Create connections that span generations. Add family members and build your family tree with beautiful stories and memories.
            </p>
          </div>
          <AddFamilyMemberForm onMemberAdded={handleMemberAdded} />
        </Modal>
    </div>
  );
}

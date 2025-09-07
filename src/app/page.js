'use client';

import { useState, useRef } from 'react';
import FamilyTree from '@/components/FamilyTree';
import AddFamilyMemberForm from '@/components/AddFamilyMemberForm';
import Modal from '@/components/Modal';

export default function Home() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshTree, setRefreshTree] = useState(0);
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  const familyTreeRef = useRef(null);

  const handleMemberAdded = (memberData) => {
    console.log('🔍 Debug: handleMemberAdded called with:', memberData);
    console.log('🔍 Debug: Refreshing tree, current refreshTree:', refreshTree);
    setRefreshTree(prev => {
      console.log('🔍 Debug: Setting refreshTree from', prev, 'to', prev + 1);
      return prev + 1;
    });
    setShowAddForm(false);
    console.log('🔍 Debug: Form closed, tree should refresh');
  };

  const handleSearchA = () => {
    if (familyTreeRef.current && familyTreeRef.current.handleSearchA) {
      familyTreeRef.current.handleSearchA(searchA);
    }
  };

  const handleSearchPath = () => {
    if (familyTreeRef.current && familyTreeRef.current.handleSearchPath) {
      familyTreeRef.current.handleSearchPath(searchA, searchB);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Title */}
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌳</span>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Family Lineage
              </h1>
            </div>

            {/* Search Controls */}
            <div className="flex flex-col md:flex-row items-center gap-4 flex-1 max-w-4xl">
              <div className="flex-1 max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Person (A)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={searchA}
                    onChange={(e) => setSearchA(e.target.value)}
                    placeholder="Enter name to search"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchA()}
                  />
                  <button
                    onClick={handleSearchA}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    Find
                  </button>
                </div>
              </div>
              
              <div className="flex-1 max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Find Path to Person (B)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={searchB}
                    onChange={(e) => setSearchB(e.target.value)}
                    placeholder="Enter name to find path"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchPath()}
                  />
                  <button
                    onClick={handleSearchPath}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                  >
                    Path
                  </button>
                </div>
              </div>
            </div>

            {/* Add Family Member Button */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                showAddForm 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {showAddForm ? (
                <>
                  <span>✕</span>
                  <span>Close Form</span>
                </>
              ) : (
                <>
                  <span>👥</span>
                  <span>Add Family Member</span>
                </>
              )}
            </button>
          </div>
        </header>

        <main>
          <FamilyTree 
            key={refreshTree} 
            ref={familyTreeRef}
          />
        </main>

        <Modal 
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          title={
            <div className="flex items-center gap-3">
              <span className="text-2xl">👥</span>
              <span>Add New Family Member</span>
            </div>
          }
        >
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6 border border-blue-200">
            <p className="text-blue-800 text-sm">
              Create connections that span generations. Add family members and build your family tree with beautiful stories and memories.
            </p>
          </div>
          <AddFamilyMemberForm onMemberAdded={handleMemberAdded} />
        </Modal>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import FamilyTree from '@/components/FamilyTree';
import AddFamilyMemberForm from '@/components/AddFamilyMemberForm';

export default function Home() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshTree, setRefreshTree] = useState(0);

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">My Family Tree</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {showAddForm ? 'Close Form' : 'Add Family Member'}
          </button>
        </header>

        {showAddForm && (
          <div className="mb-8">
            <AddFamilyMemberForm onMemberAdded={handleMemberAdded} />
          </div>
        )}

        <main>
          <FamilyTree key={refreshTree} />
        </main>
      </div>
    </div>
  );
}

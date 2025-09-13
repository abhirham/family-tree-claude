'use client';

import { useState, useRef, useEffect } from 'react';
import FamilyTree from '@/components/FamilyTree';
import AddFamilyMemberForm from '@/components/AddFamilyMemberForm';
import LoginForm from '@/components/LoginForm';
import AssignAdminModal from '@/components/AssignAdminModal';
import FirstLoginPasswordChange from '@/components/FirstLoginPasswordChange';
import Modal from '@/components/Modal';
import { getAllFamilyMembers } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/context/PermissionContext';

export default function Home() {
  const { user, loading, logout } = useAuth();
  const { permissions, refreshPermissions } = usePermissions();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showAssignAdmin, setShowAssignAdmin] = useState(false);
  const [selectedMemberForAdmin, setSelectedMemberForAdmin] = useState(null);
  const [refreshTree, setRefreshTree] = useState(0);
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  const [familyMembers, setFamilyMembers] = useState([]);
  const familyTreeRef = useRef(null);

  // Fetch family members for search autocomplete (always load for viewing)
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

  const handleNavigateToMember = (member) => {
    if (familyTreeRef.current && familyTreeRef.current.navigateToMember) {
      familyTreeRef.current.navigateToMember(member);
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

  const handleAssignAdmin = (member) => {
    setSelectedMemberForAdmin(member);
    setShowAssignAdmin(true);
  };

  const handleAssignAdminSuccess = async (result) => {
    console.log('Branch created successfully:', result);
    // Refresh permissions and tree data
    await refreshPermissions();
    setRefreshTree(prev => prev + 1);
    // Show success message
    // You could add a toast notification here
  };

  const handlePasswordChangeSuccess = async () => {
    // Refresh permissions to remove mustChangePassword flag
    await refreshPermissions();
  };


  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-airbnb-rausch border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show password change modal for new users
  if (user && permissions.mustChangePassword) {
    return (
      <div className="min-h-screen bg-surface">
        <FirstLoginPasswordChange onSuccess={handlePasswordChangeSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Fixed Top Bar */}
      <header className="sticky top-0 z-30 bg-white shadow-airbnb border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Title */}
            <div className="flex items-center min-w-0 flex-1">
              <h1 className="text-2xl font-semibold text-gray-900 truncate">
                Your Family's Story
              </h1>
              {user && (
                <span className="ml-4 text-sm text-gray-500 hidden sm:inline">
                  Welcome, {user.email}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Add Family Member Button - Only for authenticated users */}
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
                        <span>Introduce Someone New</span>
                      </>
                    )}
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-airbnb text-sm"
                    title="Sign Out"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Login Button - Only for unauthenticated users */}
                  <button
                    onClick={() => setShowLoginForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-airbnb-rausch text-white hover:bg-red-600 rounded-lg font-medium transition-airbnb whitespace-nowrap flex-shrink-0 shadow-airbnb hover:shadow-airbnb-hover"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign In</span>
                  </button>
                </>
              )}
            </div>
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
          onNavigateToMember={handleNavigateToMember}
          onAssignAdmin={handleAssignAdmin}
        />
      </main>

      {/* Add Family Member Modal - Only accessible when authenticated */}
      {user && (
        <Modal 
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          title="Introduce Someone New"
        >
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <p className="text-gray-700 text-sm">
              Every family story starts with someone special. Who would you like to introduce to your family's story?
            </p>
          </div>
          <AddFamilyMemberForm onMemberAdded={handleMemberAdded} />
        </Modal>
      )}

      {/* Login Modal */}
      <Modal 
        isOpen={showLoginForm}
        onClose={() => setShowLoginForm(false)}
        title=""
        showCloseButton={true}
      >
        <LoginForm 
          onSuccess={() => {
            setShowLoginForm(false);
            console.log('Login successful');
          }}
          onError={(error) => {
            console.error('Login error:', error);
          }}
        />
      </Modal>

      {/* Assign Admin Modal */}
      <AssignAdminModal
        isOpen={showAssignAdmin}
        onClose={() => {
          setShowAssignAdmin(false);
          setSelectedMemberForAdmin(null);
        }}
        selectedMember={selectedMemberForAdmin}
        onSuccess={handleAssignAdminSuccess}
      />
    </div>
  );
}

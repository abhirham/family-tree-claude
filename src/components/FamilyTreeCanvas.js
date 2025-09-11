'use client';

import { useState, useMemo } from 'react';
import HierarchicalTreeNode from './HierarchicalTreeNode';
import AutoComplete from './AutoComplete';

function FamilyTreeCanvas({
  familyMembers,
  onOpenDetail,
  className = "",
  searchA,
  setSearchA,
  searchB,
  setSearchB,
  onSearchA,
  onSearchPath,
  onNavigateToMember,
  selectedPerson,
  setSelectedPerson
}) {
  // State for tracking expanded nodes
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Get root members (those marked with root: true)
  const rootMembers = useMemo(() => {
    return familyMembers.filter(member => member.root === true);
  }, [familyMembers]);

  // Determine display mode based on number of root members and selected person
  const displayMode = useMemo(() => {
    if (rootMembers.length === 0) return 'empty';
    if (selectedPerson) return 'selected-person'; // Show selected person prominently
    if (rootMembers.length === 1) return 'single-root';
    return 'multiple-roots';
  }, [rootMembers.length, selectedPerson]);

  // Handle node expansion/collapse
  const handleToggleExpand = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Reset all expansions
  const handleResetTree = () => {
    setExpandedNodes(new Set());
  };

  // Get spouse for a member
  const getSpouse = (member) => {
    if (!member.spouseId) return null;
    return familyMembers.find(person => person.id === member.spouseId);
  };

  // Render empty state
  if (displayMode === 'empty') {
    return (
      <div className={`flex items-center justify-center min-h-96 ${className}`}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-gray-400 font-semibold">TREE</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Your Family Tree Awaits
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Start building your family history by adding your first family member
          </p>
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <span>Click "Add Family Member" above to begin</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Tree Controls */}
      <div className="flex justify-between items-center mb-8 px-4">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-gray-800">Family Tree</h2>
          <p className="text-gray-600 text-sm">
            {displayMode === 'single-root' 
              ? 'Click + to expand family lineage' 
              : 'Multiple family roots - click + to explore each lineage'
            }
          </p>
        </div>

        {/* Search Controls */}
        <div className="flex items-center gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              {/* Primary Search */}
              <div className="min-w-64">
                <AutoComplete
                  options={familyMembers || []}
                  value={searchA || ""}
                  onChange={setSearchA}
                  onSelect={(value, member) => {
                    setSearchA(member.name);
                    setSelectedPerson(member);
                    if (member) {
                      // Expand the selected member to show their relationships
                      setExpandedNodes(prev => {
                        const newSet = new Set(prev);
                        newSet.add(member.id);
                        return newSet;
                      });
                      
                      if (onNavigateToMember) {
                        // Navigate directly to the member using the new method
                        setTimeout(() => onNavigateToMember(member), 100);
                      }
                    }
                  }}
                  placeholder="Search family members..."
                  displayKey="name"
                  valueKey="id"
                  className="text-sm"
                  clearable={true}
                  onClear={() => {
                    setSearchA("");
                    setSearchB("");
                    setSelectedPerson(null);
                    setExpandedNodes(new Set()); // Clear all expansions when clearing search
                  }}
                  renderOption={(member, isHighlighted) => (
                    <div
                      className={`flex items-center gap-2 text-sm ${
                        isHighlighted ? "text-airbnb-rausch" : "text-gray-900"
                      }`}
                    >
                      <span
                        className={`text-xs font-medium ${
                          member.root ? "text-airbnb-rausch" : "text-gray-500"
                        }`}
                      >
                        {member.root ? "ROOT" : "MEMBER"}
                      </span>
                      <span>{member.name}</span>
                      {member.birthDate && (
                        <span className="text-xs text-gray-500 ml-auto">
                          {new Date(member.birthDate.seconds * 1000).getFullYear()}
                        </span>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Path Finding - Show only when person is selected */}
              {selectedPerson && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Find path to:</span>
                  </div>
                  <div className="min-w-64">
                    <AutoComplete
                      options={
                        familyMembers?.filter((m) => m.id !== selectedPerson.id) ||
                        []
                      }
                      value={searchB || ""}
                      onChange={setSearchB}
                      onSelect={(value, member) => {
                        setSearchB(value);
                      }}
                      placeholder="Select destination person..."
                      displayKey="name"
                      valueKey="id"
                      className="text-sm"
                      clearable={true}
                      onClear={() => {
                        setSearchB("");
                      }}
                      renderOption={(member, isHighlighted) => (
                        <div
                          className={`flex items-center gap-2 text-sm ${
                            isHighlighted ? "text-airbnb-babu" : "text-gray-900"
                          }`}
                        >
                          <span
                            className={`text-xs font-medium ${
                              member.root ? "text-airbnb-babu" : "text-gray-500"
                            }`}
                          >
                            {member.root ? "ROOT" : "MEMBER"}
                          </span>
                          <span>{member.name}</span>
                          {member.birthDate && (
                            <span className="text-xs text-gray-500 ml-auto">
                              {new Date(
                                member.birthDate.seconds * 1000
                              ).getFullYear()}
                            </span>
                          )}
                        </div>
                      )}
                    />
                  </div>
                  <button
                    onClick={() => onSearchPath()}
                    disabled={!searchB}
                    className="px-4 py-2 bg-airbnb-babu text-white rounded-lg hover:bg-teal-600 transition-airbnb font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Find Path
                  </button>
                </>
              )}
            </div>
          </div>
          
          {expandedNodes.size > 0 && (
            <button
              onClick={handleResetTree}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-airbnb text-sm font-medium"
            >
              Collapse All
            </button>
          )}
        </div>
      </div>

      {/* Tree Canvas with Gradient Background */}
      <div className="relative overflow-x-auto overflow-y-visible">
        <div className="min-w-full py-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl">
          <div className="tree flex justify-center">
            <ul>
              {displayMode === 'selected-person' ? (
                // Selected person from search: show them prominently with their relationships
                <HierarchicalTreeNode
                  member={selectedPerson}
                  allMembers={familyMembers}
                  expandedNodes={expandedNodes}
                  onToggleExpand={handleToggleExpand}
                  onOpenDetail={onOpenDetail}
                  level={0}
                  isRoot={false}
                  showSpouse={true} // Always show spouse for selected person
                />
              ) : displayMode === 'single-root' ? (
                // Single root: show with spouse if they have one
                <HierarchicalTreeNode
                  member={rootMembers[0]}
                  allMembers={familyMembers}
                  expandedNodes={expandedNodes}
                  onToggleExpand={handleToggleExpand}
                  onOpenDetail={onOpenDetail}
                  level={0}
                  isRoot={true}
                  showSpouse={true}
                />
              ) : (
                // Multiple roots: show all roots as siblings
                rootMembers
                  .filter(rootMember => {
                    // Hide siblings if any sibling is expanded
                    const anyRootExpanded = rootMembers.some(rm => expandedNodes.has(rm.id));
                    if (anyRootExpanded) {
                      return expandedNodes.has(rootMember.id);
                    }
                    return true;
                  })
                  .map((rootMember) => (
                    <HierarchicalTreeNode
                      key={rootMember.id}
                      member={rootMember}
                      allMembers={familyMembers}
                      expandedNodes={expandedNodes}
                      onToggleExpand={handleToggleExpand}
                      onOpenDetail={onOpenDetail}
                      level={0}
                      isRoot={true}
                      showSpouse={expandedNodes.has(rootMember.id)} // Show spouse when this root is expanded
                    />
                  ))
              )}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}

export default FamilyTreeCanvas;
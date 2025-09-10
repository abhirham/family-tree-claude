'use client';

import { useState, useMemo } from 'react';
import HierarchicalTreeNode from './HierarchicalTreeNode';

function FamilyTreeCanvas({
  familyMembers,
  onOpenDetail,
  className = ""
}) {
  // State for tracking expanded nodes
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Get root members (those marked with root: true)
  const rootMembers = useMemo(() => {
    return familyMembers.filter(member => member.root === true);
  }, [familyMembers]);

  // Determine display mode based on number of root members
  const displayMode = useMemo(() => {
    if (rootMembers.length === 0) return 'empty';
    if (rootMembers.length === 1) return 'single-root';
    return 'multiple-roots';
  }, [rootMembers.length]);

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
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Family Tree</h2>
          <p className="text-gray-600 text-sm">
            {displayMode === 'single-root' 
              ? 'Click + to expand family lineage' 
              : 'Multiple family roots - click + to explore each lineage'
            }
          </p>
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

      {/* Tree Canvas with Gradient Background */}
      <div className="relative overflow-x-auto overflow-y-visible">
        <div className="min-w-full py-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl">
          {displayMode === 'single-root' ? (
            // Single root: show with spouse if they have one
            <div className="flex justify-center">
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
            </div>
          ) : (
            // Multiple roots: show all roots as siblings side by side
            <div>
              
              {/* Show root members side by side as siblings */}
              <div className="relative">
                {/* Horizontal line connecting root siblings */}
                {rootMembers.length > 1 && (
                  <div 
                    className="absolute h-0.5 bg-gray-300"
                    style={{
                      top: '40px', // Position above the names
                      left: '50%',
                      width: `${(rootMembers.length - 1) * 200 + 80}px`,
                      transform: 'translateX(-50%)'
                    }}
                  />
                )}
                
                <div className="flex justify-center gap-32">
                  {rootMembers
                    .filter(rootMember => {
                      // Hide siblings if any sibling is expanded
                      const anyRootExpanded = rootMembers.some(rm => expandedNodes.has(rm.id));
                      if (anyRootExpanded) {
                        return expandedNodes.has(rootMember.id);
                      }
                      return true;
                    })
                    .map((rootMember, index, filteredRoots) => (
                    <div key={rootMember.id} className="relative">
                      {/* Vertical line from horizontal line to each root */}
                      {filteredRoots.length > 1 && (
                        <div className="absolute w-0.5 h-6 bg-gray-300" 
                             style={{ top: '34px', left: '50%', transform: 'translateX(-50%)' }} />
                      )}
                      
                      <HierarchicalTreeNode
                        member={rootMember}
                        allMembers={familyMembers}
                        expandedNodes={expandedNodes}
                        onToggleExpand={handleToggleExpand}
                        onOpenDetail={onOpenDetail}
                        level={0}
                        isRoot={true}
                        showSpouse={expandedNodes.has(rootMember.id)} // Show spouse when this root is expanded
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default FamilyTreeCanvas;
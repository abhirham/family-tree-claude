'use client';

import { useState, useMemo } from 'react';
import TreeNodeCard from './TreeNodeCard';

function HierarchicalTreeNode({
  member,
  allMembers,
  expandedNodes,
  onToggleExpand,
  onOpenDetail,
  level = 0,
  isRoot = false,
  showSpouse = false,
}) {
  // Get children of this member
  const children = useMemo(() => {
    return allMembers.filter(person => 
      person.parentIds && person.parentIds.includes(member.id)
    );
  }, [allMembers, member.id]);

  // Get spouse of this member
  const spouse = useMemo(() => {
    if (!member.spouseId) return null;
    return allMembers.find(person => person.id === member.spouseId);
  }, [allMembers, member.spouseId]);

  // Check if this node is expanded
  const isExpanded = expandedNodes.has(member.id);
  
  // Check if this member has children
  const hasChildren = children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Current Member Node */}
      <div className="relative">
        <TreeNodeCard
          member={member}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          onToggleExpand={onToggleExpand}
          onOpenDetail={onOpenDetail}
          showSpouse={showSpouse && isRoot}
          spouse={spouse}
          allMembers={allMembers}
          className="mb-6"
        />

        {/* Connection line down to children (if expanded and has children) */}
        {isExpanded && hasChildren && (
          <div className="absolute left-1/2 transform -translate-x-0.5 w-0.5 h-6 bg-gray-300" 
               style={{ top: '100%' }} />
        )}
      </div>

      {/* Children Level */}
      {isExpanded && hasChildren && (
        <div className="relative">
          {/* Horizontal line across children */}
          {children.length > 1 && (
            <div 
              className="absolute h-0.5 bg-gray-300"
              style={{
                top: '-12px',
                left: '0%',
                right: '0%',
                width: `${(children.length - 1) * 160 + 80}px`,
                transform: 'translateX(-50%)',
                left: '50%'
              }}
            />
          )}

          {/* Children Nodes */}
          <div className="flex gap-16 pt-6">
            {children
              .filter(child => {
                // Hide siblings if any sibling is expanded at this level
                const anySiblingExpanded = children.some(c => expandedNodes.has(c.id));
                if (anySiblingExpanded) {
                  return expandedNodes.has(child.id);
                }
                return true;
              })
              .map((child, index, filteredChildren) => (
              <div key={child.id} className="relative flex flex-col items-center">
                {/* Vertical line from horizontal line to child */}
                <div className="absolute w-0.5 h-6 bg-gray-300" 
                     style={{ top: '-18px', left: '50%', transform: 'translateX(-50%)' }} />
                
                {/* Recursive Child Node */}
                <HierarchicalTreeNode
                  member={child}
                  allMembers={allMembers}
                  expandedNodes={expandedNodes}
                  onToggleExpand={onToggleExpand}
                  onOpenDetail={onOpenDetail}
                  level={level + 1}
                  isRoot={false}
                  showSpouse={expandedNodes.has(child.id)} // Show spouse when child is expanded
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show spouse's children as step-children when this node is expanded */}
      {isExpanded && spouse && (
        <div className="mt-8">
          {(() => {
            // Get spouse's children who are not already shown as this person's children
            const spouseChildren = allMembers.filter(person => 
              person.parentIds && 
              person.parentIds.includes(spouse.id) &&
              (!person.parentIds.includes(member.id)) // Not already a child of this member
            );

            if (spouseChildren.length === 0) return null;

            return (
              <div className="relative">
                {/* Label for step-children */}
                <div className="text-xs text-gray-500 text-center mb-4">
                  Step-children from {spouse.name}
                </div>
                
                {/* Step-children display */}
                <div className="flex gap-16">
                  {spouseChildren.map((stepChild) => (
                    <HierarchicalTreeNode
                      key={stepChild.id}
                      member={stepChild}
                      allMembers={allMembers}
                      expandedNodes={expandedNodes}
                      onToggleExpand={onToggleExpand}
                      onOpenDetail={onOpenDetail}
                      level={level + 1}
                      isRoot={false}
                      showSpouse={false}
                    />
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default HierarchicalTreeNode;
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
    <li>
      {/* Current Member Node */}
      <div className="tree-node">
        <TreeNodeCard
          member={member}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          onToggleExpand={onToggleExpand}
          onOpenDetail={onOpenDetail}
          showSpouse={showSpouse && isExpanded}
          spouse={spouse}
          allMembers={allMembers}
          className=""
        />
      </div>

      {/* Children Level */}
      {isExpanded && hasChildren && (
        <ul>
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
            <HierarchicalTreeNode
              key={child.id}
              member={child}
              allMembers={allMembers}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              onOpenDetail={onOpenDetail}
              level={level + 1}
              isRoot={false}
              showSpouse={true} // Allow spouse to be shown when child is expanded
            />
          ))}
        </ul>
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
                
                {/* Step-children as separate ul */}
                <ul>
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
                </ul>
              </div>
            );
          })()}
        </div>
      )}
    </li>
  );
}

export default HierarchicalTreeNode;
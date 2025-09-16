"use client";

import { useState, useMemo } from "react";
import HierarchicalTreeNode from "./HierarchicalTreeNode";
import AutoComplete from "./AutoComplete";

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
  setSelectedPerson,
}) {
  // State for tracking expanded nodes
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Get root members (those marked with root: true)
  const rootMembers = useMemo(() => {
    return familyMembers.filter((member) => member.root === true);
  }, [familyMembers]);

  // Determine display mode based on number of root members and selected person
  const displayMode = useMemo(() => {
    if (rootMembers.length === 0) return "empty";
    if (selectedPerson) return "selected-person"; // Show selected person prominently
    if (rootMembers.length === 1) return "single-root";
    return "multiple-roots";
  }, [rootMembers.length, selectedPerson]);

  // Get all descendants of a node recursively
  const getAllDescendants = (nodeId, visited = new Set()) => {
    if (visited.has(nodeId)) return new Set(); // Prevent circular references
    visited.add(nodeId);

    const descendants = new Set();

    // Find all children of this node
    const children = familyMembers.filter(
      (person) => person.parentIds && person.parentIds.includes(nodeId),
    );

    children.forEach((child) => {
      descendants.add(child.id);
      // Recursively get descendants of this child
      const childDescendants = getAllDescendants(child.id, visited);
      childDescendants.forEach((descendantId) => descendants.add(descendantId));
    });

    // Also include spouse's children (step-children) if this node has a spouse
    const member = familyMembers.find((m) => m.id === nodeId);
    if (member && member.spouseId) {
      const spouseChildren = familyMembers.filter(
        (person) =>
          person.parentIds &&
          person.parentIds.includes(member.spouseId) &&
          !person.parentIds.includes(nodeId), // Not already a child of this member
      );

      spouseChildren.forEach((stepChild) => {
        descendants.add(stepChild.id);
        // Recursively get descendants of this step-child
        const stepChildDescendants = getAllDescendants(stepChild.id, visited);
        stepChildDescendants.forEach((descendantId) =>
          descendants.add(descendantId),
        );
      });
    }

    return descendants;
  };

  // Handle node expansion/collapse
  const handleToggleExpand = (nodeId) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        // Collapsing: remove this node and ALL its descendants
        newSet.delete(nodeId);
        const descendants = getAllDescendants(nodeId);
        descendants.forEach((descendantId) => newSet.delete(descendantId));
      } else {
        // Expanding: just add this node
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
    return familyMembers.find((person) => person.id === member.spouseId);
  };

  // Render empty state
  if (displayMode === "empty") {
    return (
      <div
        className={`flex items-center justify-center min-h-[600px] ${className}`}
      >
        <div className="text-center max-w-2xl mx-auto px-8">
          {/* Beautiful Tree Visualization */}
          <div className="relative mb-8">
            <div className="relative w-80 h-48 mx-auto">
              {/* Tree illustration with organic, flowing design */}
              <svg
                viewBox="0 0 320 192"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Tree trunk */}
                <path
                  d="M160 192 L160 140 Q160 130 155 125 Q150 120 145 125 Q140 130 140 140 L140 192"
                  fill="#8B4513"
                  className="opacity-80"
                />

                {/* Tree branches - organic flowing lines */}
                <path
                  d="M150 140 Q120 120 100 100 Q80 90 70 85"
                  stroke="#4A5568"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="opacity-60"
                />
                <path
                  d="M160 135 Q190 115 210 95 Q230 85 240 80"
                  stroke="#4A5568"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="opacity-60"
                />
                <path
                  d="M155 130 Q130 110 115 90 Q100 75 95 70"
                  stroke="#4A5568"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="opacity-50"
                />
                <path
                  d="M165 130 Q195 110 215 90 Q235 75 245 70"
                  stroke="#4A5568"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="opacity-50"
                />

                {/* Family member circles - positioned like ornaments on tree */}
                <circle
                  cx="70"
                  cy="85"
                  r="12"
                  fill="#FF385C"
                  className="opacity-70"
                />
                <circle
                  cx="95"
                  cy="70"
                  r="10"
                  fill="#00A699"
                  className="opacity-70"
                />
                <circle
                  cx="160"
                  cy="100"
                  r="14"
                  fill="#FF385C"
                  className="opacity-80"
                />
                <circle
                  cx="240"
                  cy="80"
                  r="12"
                  fill="#00A699"
                  className="opacity-70"
                />
                <circle
                  cx="245"
                  cy="70"
                  r="10"
                  fill="#FF385C"
                  className="opacity-60"
                />

                {/* Connecting lines between family members */}
                <path
                  d="M82 85 Q130 90 148 100"
                  stroke="#E2E8F0"
                  strokeWidth="2"
                  strokeDasharray="3,3"
                  className="opacity-40"
                />
                <path
                  d="M174 100 Q210 90 228 80"
                  stroke="#E2E8F0"
                  strokeWidth="2"
                  strokeDasharray="3,3"
                  className="opacity-40"
                />

                {/* Subtle floating elements suggesting growth and connection */}
                <circle
                  cx="50"
                  cy="60"
                  r="2"
                  fill="#00A699"
                  className="opacity-30 animate-pulse"
                />
                <circle
                  cx="270"
                  cy="55"
                  r="2"
                  fill="#FF385C"
                  className="opacity-30 animate-pulse"
                />
                <circle
                  cx="160"
                  cy="50"
                  r="1.5"
                  fill="#4A5568"
                  className="opacity-20 animate-pulse"
                />
              </svg>

              {/* Gentle glow effect */}
              <div className="absolute inset-0 bg-gradient-radial from-orange-100/30 via-transparent to-transparent rounded-full" />
            </div>
          </div>

          {/* Story-driven heading */}
          <h2 className="text-3xl font-semibold text-gray-800 mb-6 leading-tight">
            Every Family Tree Starts
            <br />
            <span className="text-airbnb-rausch">With a Single Story</span>
          </h2>

          {/* Emotional copy */}
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            Imagine generations of your family flowing together like branches of
            a living tree. Each person you add becomes part of a beautiful story
            that connects past, present, and future.
          </p>

          {/* Subtle call to action */}
          <div className="text-gray-500 text-sm">
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-airbnb-rausch rounded-full animate-pulse"></span>
              Ready to plant the first seed of your family's story?
            </span>
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
          <h2 className="text-2xl font-semibold text-gray-800">
            Your Family's Story
          </h2>
          <p className="text-gray-600 text-sm">
            {displayMode === "single-root"
              ? "Explore the connections that bind your family together"
              : "Discover the beautiful stories woven through generations"}
          </p>
        </div>

        {/* Integrated Search Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4">
            {/* Story-driven search */}
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
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
                      setExpandedNodes((prev) => {
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
                  placeholder="Who would you like to visit?"
                  displayKey="name"
                  valueKey="id"
                  className="text-sm border-0 bg-transparent focus:ring-2 focus:ring-airbnb-rausch/20 rounded-lg"
                  clearable={true}
                  onClear={() => {
                    setSearchA("");
                    setSearchB("");
                    setSelectedPerson(null);
                    setExpandedNodes(new Set()); // Clear all expansions when clearing search
                  }}
                  renderOption={(member, isHighlighted) => (
                    <div
                      className={`flex items-center gap-3 text-sm py-3 px-4 ${
                        isHighlighted
                          ? "text-airbnb-rausch bg-red-50"
                          : "text-gray-900"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">{member.name}</span>
                        {member.birthDate && (
                          <span className="text-xs text-gray-500 ml-2">
                            Born{" "}
                            {new Date(
                              member.birthDate.seconds * 1000,
                            ).getFullYear()}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          member.root
                            ? "bg-airbnb-rausch text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {member.root ? "ROOT" : "MEMBER"}
                      </span>
                    </div>
                  )}
                />
              </div>

              {/* Story-driven Path Finding */}
              {selectedPerson && (
                <>
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm">Discover the connection to</span>
                  </div>
                  <div className="min-w-64">
                    <AutoComplete
                      options={
                        familyMembers?.filter(
                          (m) => m.id !== selectedPerson.id,
                        ) || []
                      }
                      value={searchB || ""}
                      onChange={setSearchB}
                      onSelect={(value, member) => {
                        setSearchB(value);
                      }}
                      placeholder="Who are they connected to?"
                      displayKey="name"
                      valueKey="id"
                      className="text-sm border-0 bg-transparent focus:ring-2 focus:ring-airbnb-babu/20 rounded-lg"
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
                                member.birthDate.seconds * 1000,
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
                    Discover Connection
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
              Return to Overview
            </button>
          )}
        </div>
      </div>

      {/* Tree Canvas with Organic Background */}
      <div className="relative overflow-x-auto overflow-y-visible">
        <div className="relative min-w-full py-12 bg-gradient-to-br from-orange-50/60 via-amber-50/40 to-rose-50/60 rounded-3xl overflow-hidden">
          {/* Organic decorative elements */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Subtle tree branch patterns */}
            <svg
              className="absolute top-4 left-4 opacity-10"
              width="120"
              height="80"
              viewBox="0 0 120 80"
            >
              <path
                d="M10 70 Q30 50 50 45 Q70 40 90 35"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                className="text-amber-700"
              />
              <path
                d="M20 75 Q40 60 60 55 Q80 50 100 45"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                className="text-amber-600"
              />
            </svg>

            <svg
              className="absolute bottom-6 right-6 opacity-10 transform rotate-180"
              width="100"
              height="60"
              viewBox="0 0 100 60"
            >
              <path
                d="M10 50 Q25 35 40 30 Q55 25 70 20"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                className="text-rose-700"
              />
              <path
                d="M15 55 Q30 42 45 37 Q60 32 75 27"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                className="text-rose-600"
              />
            </svg>

            {/* Floating heritage elements */}
            <div
              className="absolute top-8 right-16 w-2 h-2 bg-amber-200 rounded-full opacity-30 animate-pulse"
              style={{ animationDelay: "0s", animationDuration: "3s" }}
            />
            <div
              className="absolute bottom-12 left-20 w-1.5 h-1.5 bg-rose-200 rounded-full opacity-40 animate-pulse"
              style={{ animationDelay: "1s", animationDuration: "4s" }}
            />
            <div
              className="absolute top-20 left-1/3 w-1 h-1 bg-orange-300 rounded-full opacity-25 animate-pulse"
              style={{ animationDelay: "2s", animationDuration: "5s" }}
            />
          </div>
          <div className="tree flex justify-center transform transition-all duration-700 ease-out animate-in">
            <ul className="space-y-8">
              {displayMode === "selected-person" ? (
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
              ) : displayMode === "single-root" ? (
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
                  .filter((rootMember) => {
                    // Hide siblings if any sibling is expanded
                    const anyRootExpanded = rootMembers.some((rm) =>
                      expandedNodes.has(rm.id),
                    );
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

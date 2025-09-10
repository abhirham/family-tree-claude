"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { getAllFamilyMembers } from "@/lib/firestore";
import PersonCard from "./PersonCard";
import RelationshipSection from "./RelationshipSection";
import AutoComplete from "./AutoComplete";

function NavigationStack({
  stack,
  onNavigateToMember,
  onClearStack,
  familyMembers,
  searchA,
  setSearchA,
  searchB,
  setSearchB,
  onSearchA,
  onSearchPath,
  selectedPerson,
  setSelectedPerson,
}) {
  const handlePersonSelect = (value, member) => {
    setSearchA(value);
    setSelectedPerson(member);
    // Auto-trigger search when person is selected
    if (member && onSearchA) {
      setTimeout(() => onSearchA(value), 100);
    }
  };

  const handleClearSearch = () => {
    setSearchA("");
    setSearchB("");
    setSelectedPerson(null);
  };

  return (
    <div className="w-72 bg-white border-r border-gray-200 px-6 pb-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6 pt-6">
        <div className="flex items-center">
          <h3 className="font-semibold text-gray-800">Navigation</h3>
        </div>
        {stack.length > 0 && (
          <button
            onClick={() => {
              handleClearSearch();
              onClearStack();
            }}
            className="text-sm text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Compact Search Section */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Search</h4>

        <div className="space-y-3">
          {/* Primary Search */}
          <div>
            <AutoComplete
              options={familyMembers || []}
              value={searchA}
              onChange={setSearchA}
              onSelect={handlePersonSelect}
              placeholder="Search family members..."
              displayKey="name"
              valueKey="id"
              className="text-sm"
              clearable={true}
              onClear={handleClearSearch}
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

          {/* Progressive: Show Path Finding only after person is selected */}
          {selectedPerson && (
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-600">Find path from</span>
                <span className="text-xs font-medium text-airbnb-rausch bg-red-50 px-2 py-1 rounded">
                  {selectedPerson.name}
                </span>
                <span className="text-xs text-gray-600">to:</span>
              </div>
              <div className="space-y-2">
                <AutoComplete
                  options={
                    familyMembers?.filter((m) => m.id !== selectedPerson.id) ||
                    []
                  }
                  value={searchB}
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
                <button
                  onClick={() => onSearchPath()}
                  disabled={!searchB}
                  className="w-full px-3 py-2 bg-airbnb-babu text-white rounded-lg hover:bg-teal-600 transition-airbnb font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Find Path
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {stack.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-gray-400 font-medium text-sm">TREE</span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Click on family members to explore connections and build your
            navigation history
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
            Navigation History
          </h4>
          {stack.map((member, index) => (
            <div
              key={`${member.id}-${index}`}
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                index === stack.length - 1
                  ? "bg-blue-50 border border-blue-200"
                  : "bg-gray-50 hover:bg-gray-100 border border-transparent"
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
                <span className="text-sm font-medium text-gray-800 truncate block">
                  {member.name}
                </span>
                <span className="text-xs text-gray-500">Step {index + 1}</span>
              </div>
              {index === stack.length - 1 && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Current
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const FamilyTree = forwardRef(
  (
    {
      familyMembers,
      searchA,
      setSearchA,
      searchB,
      setSearchB,
      onSearchA,
      onSearchPath,
      onAssignAdmin,
    },
    ref
  ) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [navigationStack, setNavigationStack] = useState([]);
    const [currentPerson, setCurrentPerson] = useState(null);
    const [displayedMembers, setDisplayedMembers] = useState([]);
    const [selectedPerson, setSelectedPerson] = useState(null);

    useImperativeHandle(ref, () => ({
      handleSearchA: (searchTerm) => {
        if (!searchTerm.trim()) return;

        const foundMember = members.find((member) =>
          member.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (foundMember) {
          setNavigationStack([]);
          handleMemberClick(foundMember);
        } else {
          alert("Person not found");
        }
      },
      handleSearchPath: (searchTermA, searchTermB) => {
        if (!searchTermA.trim() || !searchTermB.trim()) return;

        const memberA = members.find((member) =>
          member.name.toLowerCase().includes(searchTermA.toLowerCase())
        );
        const memberB = members.find((member) =>
          member.name.toLowerCase().includes(searchTermB.toLowerCase())
        );

        if (!memberA || !memberB) {
          alert("One or both persons not found");
          return;
        }

        const path = findPath(memberA.id, memberB.id);
        if (path) {
          const pathMembers = path
            .map((id) => members.find((m) => m.id === id))
            .filter(Boolean);
          setNavigationStack(pathMembers);
          setCurrentPerson(memberB);
          setDisplayedMembers([memberB]);
        } else {
          alert("No path found between the two people");
        }
      },
    }));

    useEffect(() => {
      const fetchMembers = async () => {
        try {
          const familyMembers = await getAllFamilyMembers();
          setMembers(familyMembers);

          // Show root members initially (members with root=true)
          const rootMembers = familyMembers.filter(
            (member) => member.root === true
          );

          console.log("Debug: All family members:", familyMembers);
          console.log("Debug: Root members:", rootMembers);
          console.log(
            "Debug: Setting displayed members to:",
            rootMembers.length
          );

          setDisplayedMembers(rootMembers);
        } catch (err) {
          setError("Failed to load family members: " + err.message);
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

      // If person has parentIds (they have parents)
      if (person.parentIds && person.parentIds.length > 0) {
        // Find real parents (exclude dummy parent IDs)
        person.parentIds.forEach((parentId) => {
          // Skip dummy parent IDs - they don't represent real people
          if (!parentId.startsWith('dummy_parent_')) {
            const parent = members.find((m) => m.id === parentId);
            if (parent) {
              related.add(parent.id);
              relatedWithTypes.push({ member: parent, type: "Parent" });
            }
          }
        });
        
        // Add siblings (others with same parents, including dummy parent IDs)
        const siblings = members.filter(
          (member) =>
            member.id !== person.id && 
            member.parentIds && 
            member.parentIds.some(pid => person.parentIds.includes(pid))
        );

        siblings.forEach((sibling) => {
          related.add(sibling.id);
          relatedWithTypes.push({ member: sibling, type: "Sibling" });
        });
      }

      // Find children (people who have this person in their parentIds)
      const children = members.filter(
        (member) => member.parentIds && member.parentIds.includes(person.id)
      );
      children.forEach((child) => {
        related.add(child.id);
        relatedWithTypes.push({ member: child, type: "Child" });
      });


      // Add spouse
      if (person.spouseId) {
        const spouse = members.find((m) => m.id === person.spouseId);
        if (spouse) {
          related.add(spouse.id);
          relatedWithTypes.push({ member: spouse, type: "Spouse" });

          // Also include spouse's children as step-children if they're not already included
          const spouseChildren = members.filter(
            (member) => member.parentIds && member.parentIds.includes(spouse.id)
          );
          spouseChildren.forEach((child) => {
            if (!related.has(child.id) && child.id !== person.id) {
              related.add(child.id);
              relatedWithTypes.push({ member: child, type: "Step-Child" });
            }
          });
        }
      }

      // Also find if this person is someone else's spouse
      const spouseOfMember = members.find(
        (member) => member.spouseId === person.id
      );
      if (spouseOfMember && !related.has(spouseOfMember.id)) {
        related.add(spouseOfMember.id);
        relatedWithTypes.push({ member: spouseOfMember, type: "Spouse" });

        // Include spouse's children as step-children if they're not already included
        const spouseOfChildren = members.filter(
          (member) => member.parentIds && member.parentIds.includes(spouseOfMember.id)
        );
        spouseOfChildren.forEach((child) => {
          if (!related.has(child.id) && child.id !== person.id) {
            related.add(child.id);
            relatedWithTypes.push({ member: child, type: "Step-Child" });
          }
        });
      }

      return relatedWithTypes;
    };

    const groupRelatedMembers = (relatedMembers) => {
      const groups = {
        spouses: [],
        children: [],
        parents: [],
        siblings: [],
        stepChildren: [],
      };

      relatedMembers.forEach((item) => {
        switch (item.type) {
          case "Spouse":
            groups.spouses.push(item);
            break;
          case "Child":
            groups.children.push(item);
            break;
          case "Step-Child":
            groups.stepChildren.push(item);
            break;
          case "Parent":
            groups.parents.push(item);
            break;
          case "Sibling":
            groups.siblings.push(item);
            break;
        }
      });

      return groups;
    };

    const getReverseRelationship = (relationshipType) => {
      const reverseMap = {
        parent: "Child",
        child: "Parent",
        spouse: "Spouse",
        sibling: "Sibling",
      };
      return reverseMap[relationshipType];
    };

    const handleMemberClick = (member) => {
      const relatedMembers = getRelatedMembers(member);
      setCurrentPerson(member);
      setDisplayedMembers([member, ...relatedMembers.map((r) => r.member)]);

      // Add to navigation stack
      setNavigationStack((prev) => [...prev, member]);
    };

    const handleNavigateFromStack = (member, index) => {
      const relatedMembers = getRelatedMembers(member);
      setCurrentPerson(member);
      setDisplayedMembers([member, ...relatedMembers.map((r) => r.member)]);

      // Trim navigation stack to the clicked position
      setNavigationStack((prev) => prev.slice(0, index + 1));
    };

    const handleClearStack = () => {
      setNavigationStack([]);
      setCurrentPerson(null);

      // Show root members again
      const rootMembers = members.filter((member) => member.root === true);
      setDisplayedMembers(rootMembers);
    };

    const getPrioritizedConnections = (person) => {
      const connections = [];

      // Priority 1: Children (people who have this person in their parentIds)
      const children = members.filter(
        (member) => member.parentIds && member.parentIds.includes(person.id)
      );
      children.forEach((child) => {
        connections.push(child.id);
      });

      // Priority 2: Siblings (people with same parentIds)
      if (person.parentIds && person.parentIds.length > 0) {
        // Find siblings with same parents
        const siblings = members.filter(
          (member) =>
            member.id !== person.id && 
            member.parentIds && 
            member.parentIds.some(pid => person.parentIds.includes(pid))
        );
        siblings.forEach((sibling) => {
          connections.push(sibling.id);
        });
      }

      // Priority 3: Parents (from parentIds, excluding dummy parents)
      if (person.parentIds && person.parentIds.length > 0) {
        person.parentIds.forEach((parentId) => {
          // Skip dummy parent IDs - they don't represent real people
          if (!parentId.startsWith('dummy_parent_') && !connections.includes(parentId)) {
            connections.push(parentId);
          }
        });
      }

      // Priority 4: Spouse
      if (person.spouseId) {
        const spouse = members.find((m) => m.id === person.spouseId);
        if (spouse && !connections.includes(spouse.id)) {
          connections.push(spouse.id);
        }
      }

      // Priority 5: Step-children (spouse's children that aren't already included)
      if (person.spouseId) {
        const spouseChildren = members.filter(
          (member) => member.parentIds && member.parentIds.includes(person.spouseId)
        );
        spouseChildren.forEach((stepChild) => {
          if (!connections.includes(stepChild.id)) {
            connections.push(stepChild.id);
          }
        });
      }

      // Priority 6: Find if this person is someone else's spouse (bidirectional spouse)
      const spouseOfMember = members.find(
        (member) => member.spouseId === person.id
      );
      if (spouseOfMember && !connections.includes(spouseOfMember.id)) {
        connections.push(spouseOfMember.id);
      }

      return connections;
    };

    const findPath = (startId, endId) => {
      if (startId === endId) return [startId];

      // Use BFS to find the shortest path with prioritized relationships
      const queue = [[startId]]; // Queue of paths
      const visited = new Set([startId]);

      while (queue.length > 0) {
        const currentPath = queue.shift();
        const currentId = currentPath[currentPath.length - 1];

        const currentMember = members.find((m) => m.id === currentId);
        if (!currentMember) continue;

        // Get prioritized connections (children first, then siblings, then parents, then spouses)
        const connections = getPrioritizedConnections(currentMember);

        for (const connectionId of connections) {
          if (connectionId === endId) {
            // Found the target - return the complete path
            return [...currentPath, connectionId];
          }

          if (!visited.has(connectionId)) {
            visited.add(connectionId);
            queue.push([...currentPath, connectionId]);
          }
        }
      }

      return null; // No path found
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
      <div className="flex min-h-screen">
        {/* Left Sidebar - Navigation Stack - Hidden on mobile/tablet */}
        <div
          className="hidden lg:block fixed left-0 w-72 z-40"
          style={{ top: "74px", height: "calc(100vh - 74px)" }}
        >
          <NavigationStack
            stack={navigationStack}
            onNavigateToMember={handleNavigateFromStack}
            onClearStack={handleClearStack}
            familyMembers={familyMembers}
            searchA={searchA}
            setSearchA={setSearchA}
            searchB={searchB}
            setSearchB={setSearchB}
            onSearchA={onSearchA}
            onSearchPath={onSearchPath}
            selectedPerson={selectedPerson}
            setSelectedPerson={setSelectedPerson}
          />
        </div>

        {/* Main Content with left margin for sidebar on large screens only */}
        <div className="flex-1 lg:ml-72 overflow-auto my-3">
          {/* Family Tree Display */}
          <div className=" mx-auto px-3">
            {displayedMembers.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-400 font-semibold">TREE</span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Your Family Tree Awaits
                </h2>
                <p className="text-gray-600 text-lg mb-6">
                  Start building your family history by adding your first family
                  member
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
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
                  onAssignAdmin={onAssignAdmin}
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
                      />

                      <RelationshipSection
                        title="Children"
                        members={groups.children}
                        onMemberClick={handleMemberClick}
                        currentPerson={currentPerson}
                      />

                      <RelationshipSection
                        title="Step Children"
                        members={groups.stepChildren}
                        onMemberClick={handleMemberClick}
                        currentPerson={currentPerson}
                      />

                      <RelationshipSection
                        title="Parents"
                        members={groups.parents}
                        onMemberClick={handleMemberClick}
                        currentPerson={currentPerson}
                      />

                      <RelationshipSection
                        title="Siblings"
                        members={groups.siblings}
                        onMemberClick={handleMemberClick}
                        currentPerson={currentPerson}
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
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                      Family Tree
                    </h2>
                    <p className="text-gray-600">
                      Root family members - click on anyone to explore their
                      connections
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayedMembers.map((member) => (
                      <PersonCard
                        key={member.id}
                        member={member}
                        onClick={handleMemberClick}
                        isSelected={false}
                        onAssignAdmin={onAssignAdmin}
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
  }
);

FamilyTree.displayName = "FamilyTree";
export default FamilyTree;

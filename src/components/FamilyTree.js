"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { getAllFamilyMembers } from "@/lib/firestore";
import PersonCard from "./PersonCard";
import RelationshipSection from "./RelationshipSection";
import AutoComplete from "./AutoComplete";
import FamilyTreeCanvas from "./FamilyTreeCanvas";
import UserDetailModal from "./UserDetailModal";

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
      onNavigateToMember,
      onAssignAdmin,
    },
    ref,
  ) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [navigationStack, setNavigationStack] = useState([]);
    const [currentPerson, setCurrentPerson] = useState(null);
    const [displayedMembers, setDisplayedMembers] = useState([]);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailModalMember, setDetailModalMember] = useState(null);

    useImperativeHandle(ref, () => ({
      handleSearchA: (searchTerm) => {
        if (!searchTerm.trim()) return;

        const foundMember = members.find((member) =>
          member.name.toLowerCase().includes(searchTerm.toLowerCase()),
        );

        if (foundMember) {
          // Clear navigation stack and navigate to the found member
          setNavigationStack([]);
          handleMemberClick(foundMember);
        } else {
          alert("Person not found");
        }
      },
      navigateToMember: (member) => {
        if (member) {
          // Clear navigation stack and navigate to the member
          setNavigationStack([]);
          handleMemberClick(member);
        }
      },
      handleSearchPath: (searchTermA, searchTermB) => {
        if (!searchTermA.trim() || !searchTermB.trim()) return;

        const memberA = members.find((member) =>
          member.name.toLowerCase().includes(searchTermA.toLowerCase()),
        );
        const memberB = members.find((member) =>
          member.name.toLowerCase().includes(searchTermB.toLowerCase()),
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
            (member) => member.root === true,
          );

          console.log("Debug: All family members:", familyMembers);
          console.log("Debug: Root members:", rootMembers);
          console.log(
            "Debug: Setting displayed members to:",
            rootMembers.length,
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
          if (!parentId.startsWith("dummy_parent_")) {
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
            member.parentIds.some((pid) => person.parentIds.includes(pid)),
        );

        siblings.forEach((sibling) => {
          related.add(sibling.id);
          relatedWithTypes.push({ member: sibling, type: "Sibling" });
        });
      }

      // Find children (people who have this person in their parentIds)
      const children = members.filter(
        (member) => member.parentIds && member.parentIds.includes(person.id),
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
            (member) =>
              member.parentIds && member.parentIds.includes(spouse.id),
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
        (member) => member.spouseId === person.id,
      );
      if (spouseOfMember && !related.has(spouseOfMember.id)) {
        related.add(spouseOfMember.id);
        relatedWithTypes.push({ member: spouseOfMember, type: "Spouse" });

        // Include spouse's children as step-children if they're not already included
        const spouseOfChildren = members.filter(
          (member) =>
            member.parentIds && member.parentIds.includes(spouseOfMember.id),
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

    // Handle opening member detail modal
    const handleOpenDetail = (member) => {
      setDetailModalMember(member);
      setDetailModalOpen(true);
    };

    // Handle closing detail modal
    const handleCloseDetail = () => {
      setDetailModalOpen(false);
      setDetailModalMember(null);
    };

    const getPrioritizedConnections = (person) => {
      const connections = [];

      // Priority 1: Children (people who have this person in their parentIds)
      const children = members.filter(
        (member) => member.parentIds && member.parentIds.includes(person.id),
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
            member.parentIds.some((pid) => person.parentIds.includes(pid)),
        );
        siblings.forEach((sibling) => {
          connections.push(sibling.id);
        });
      }

      // Priority 3: Parents (from parentIds, excluding dummy parents)
      if (person.parentIds && person.parentIds.length > 0) {
        person.parentIds.forEach((parentId) => {
          // Skip dummy parent IDs - they don't represent real people
          if (
            !parentId.startsWith("dummy_parent_") &&
            !connections.includes(parentId)
          ) {
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
          (member) =>
            member.parentIds && member.parentIds.includes(person.spouseId),
        );
        spouseChildren.forEach((stepChild) => {
          if (!connections.includes(stepChild.id)) {
            connections.push(stepChild.id);
          }
        });
      }

      // Priority 6: Find if this person is someone else's spouse (bidirectional spouse)
      const spouseOfMember = members.find(
        (member) => member.spouseId === person.id,
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
        {/* Main Content - Full Width */}
        <div className="flex-1 overflow-auto my-3">
          {/* Hierarchical Family Tree Display */}
          <div className="mx-auto px-3">
            <FamilyTreeCanvas
              familyMembers={members}
              onOpenDetail={handleOpenDetail}
              className="bg-white rounded-2xl shadow-lg p-8"
              searchA={searchA}
              setSearchA={setSearchA}
              searchB={searchB}
              setSearchB={setSearchB}
              onSearchA={onSearchA}
              onSearchPath={onSearchPath}
              onNavigateToMember={onNavigateToMember}
              selectedPerson={selectedPerson}
              setSelectedPerson={setSelectedPerson}
              onAssignAdmin={onAssignAdmin}
            />
          </div>
        </div>

        {/* Comprehensive User Detail Modal */}
        <UserDetailModal
          member={detailModalMember}
          isOpen={detailModalOpen}
          onClose={handleCloseDetail}
          allMembers={members}
          onMemberClick={handleOpenDetail}
        />
      </div>
    );
  },
);

FamilyTree.displayName = "FamilyTree";
export default FamilyTree;

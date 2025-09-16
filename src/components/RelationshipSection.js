"use client";

import PersonCard from "./PersonCard";

function RelationshipSection({ title, members, onMemberClick, currentPerson }) {
  if (!members || members.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent" />
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {members.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {members.map((memberData) => (
          <PersonCard
            key={memberData.member.id}
            member={memberData.member}
            onClick={onMemberClick}
            relationshipType={memberData.type}
            isSelected={currentPerson?.id === memberData.member.id}
          />
        ))}
      </div>
    </div>
  );
}

export default RelationshipSection;

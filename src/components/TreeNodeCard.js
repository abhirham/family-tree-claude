"use client";

import Image from "next/image";
import { usePermissions } from "@/context/PermissionContext";

// Default circular profile images
const defaultImages = [
  "/api/placeholder/80/80",
  "/api/placeholder/80/81",
  "/api/placeholder/80/82",
  "/api/placeholder/80/83",
  "/api/placeholder/80/84",
];

function TreeNodeCard({
  member,
  isExpanded = false,
  hasChildren = false,
  onToggleExpand = null,
  onOpenDetail = null,
  showSpouse = false,
  spouse = null,
  allMembers = [],
  className = "",
}) {
  const { canAssignAdmin } = usePermissions();

  const formatYear = (dateObj) => {
    if (!dateObj) return "";
    const date = dateObj.seconds
      ? new Date(dateObj.seconds * 1000)
      : new Date(dateObj);
    return date.getFullYear();
  };

  const calculateAge = (birthDate, deathDate) => {
    if (!birthDate) return "";

    const birth = birthDate.seconds
      ? new Date(birthDate.seconds * 1000)
      : new Date(birthDate);

    if (deathDate) {
      // Person is deceased - show birth year - death year
      const death = deathDate.seconds
        ? new Date(deathDate.seconds * 1000)
        : new Date(deathDate);
      return `${birth.getFullYear()} - ${death.getFullYear()}`;
    } else {
      // Person is alive - calculate age
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birth.getDate())
      ) {
        return age - 1;
      }
      return age;
    }
  };

  // Get a consistent default image based on member ID
  const getDefaultImage = (person) => {
    if (!person.id) return defaultImages[0];
    const hash = person.id.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    return defaultImages[hash % defaultImages.length];
  };

  const handleCardClick = (person) => {
    if (onOpenDetail) {
      onOpenDetail(person);
    }
  };

  const handleExpandClick = (e) => {
    e.stopPropagation();
    if (onToggleExpand && hasChildren) {
      onToggleExpand(member.id);
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center gap-3 ${className}`}
    >
      {/* Main Member Card - Matching Image #2 Style */}
      <div className="relative group">
        <div
          className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 cursor-pointer min-w-[160px] border border-gray-100"
          onClick={() => handleCardClick(member)}
        >
          {/* Circular Profile Photo */}
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-gray-200">
              <Image
                src={member.imageUrl || getDefaultImage(member)}
                alt={member.name}
                fill
                className="object-cover rounded-full"
              />
            </div>
          </div>

          {/* Name and Title */}
          <div className="text-center mb-4">
            <h3 className="text-base font-semibold text-gray-900 mb-1 leading-tight">
              {member.name}
            </h3>
          </div>

          {/* Stats Section - 2 columns: Age and Children */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {calculateAge(member.birthDate, member.deathDate) || "--"}
              </div>
              <div className="text-xs text-gray-500">
                {member.deathDate ? "Lifespan" : "Age"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {allMembers
                  ? allMembers.filter(
                      (m) => m.parentIds && m.parentIds.includes(member.id),
                    ).length
                  : 0}
              </div>
              <div className="text-xs text-gray-500">Children</div>
            </div>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        {hasChildren && (
          <button
            onClick={handleExpandClick}
            className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg hover:bg-blue-700 transition-airbnb z-10"
            title={isExpanded ? "Collapse family" : "Expand family"}
          >
            {isExpanded ? "−" : "+"}
          </button>
        )}
      </div>

      {/* Spouse Display (for single root scenarios) */}
      {showSpouse && spouse && (
        <>
          {/* Connection Line */}
          {/* <div className="flex-1 h-0.5 bg-gray-300 mx-4" /> */}

          {/* Spouse Card - Matching Image #2 Style */}
          <div className="relative group">
            <div
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 cursor-pointer min-w-[160px] border border-gray-100"
              onClick={() => handleCardClick(spouse)}
            >
              {/* Circular Profile Photo */}
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-gray-200">
                  <Image
                    src={spouse.imageUrl || getDefaultImage(spouse)}
                    alt={spouse.name}
                    fill
                    className="object-cover rounded-full"
                  />
                </div>
              </div>

              {/* Name and Title */}
              <div className="text-center mb-4">
                <h3 className="text-base font-semibold text-gray-900 mb-1 leading-tight">
                  {spouse.name}
                </h3>
                <p className="text-sm text-gray-500">Spouse</p>
              </div>

              {/* Stats Section - 2 columns: Age and Children */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {calculateAge(spouse.birthDate, spouse.deathDate) || "--"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {spouse.deathDate ? "Lifespan" : "Age"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {allMembers
                      ? allMembers.filter(
                          (m) => m.parentIds && m.parentIds.includes(spouse.id),
                        ).length
                      : 0}
                  </div>
                  <div className="text-xs text-gray-500">Children</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TreeNodeCard;

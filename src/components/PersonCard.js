'use client';

import Image from 'next/image';

// Default landscape images inspired by the reference design
const defaultImages = [
  '/api/placeholder/400/240', // Mountain landscape
  '/api/placeholder/400/241', // Forest scene
  '/api/placeholder/400/242', // Lake view
  '/api/placeholder/400/243', // Sunset mountains
  '/api/placeholder/400/244', // Misty hills
];

function PersonCard({ member, onClick, isSelected = false, relationshipType = null, isHero = false }) {
  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    const date = dateObj.seconds ? new Date(dateObj.seconds * 1000) : new Date(dateObj);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatDateRange = (birthDate, deathDate) => {
    const birth = formatDate(birthDate);
    const death = formatDate(deathDate);
    
    if (birth && death) {
      return `${birth} - ${death}`;
    } else if (birth) {
      return `${birth} - Present`;
    }
    return '';
  };

  // Get a consistent default image based on member ID
  const getDefaultImage = () => {
    if (!member.id) return defaultImages[0];
    const hash = member.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return defaultImages[hash % defaultImages.length];
  };

  const getRelationshipBadge = () => {
    if (!relationshipType) return null;
    
    const badgeColors = {
      'Spouse': 'bg-pink-100 text-pink-800 border-pink-200',
      'Child': 'bg-green-100 text-green-800 border-green-200',
      'Parent': 'bg-blue-100 text-blue-800 border-blue-200',
      'Sibling': 'bg-purple-100 text-purple-800 border-purple-200',
      'Step-Child': 'bg-orange-100 text-orange-800 border-orange-200',
    };

    const colorClass = badgeColors[relationshipType] || 'bg-gray-100 text-gray-800 border-gray-200';

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
        {relationshipType}
      </span>
    );
  };

  if (isHero) {
    return (
      <div className="bg-white shadow-airbnb rounded-lg overflow-hidden mb-8 border border-gray-200">
        <div className="relative h-64">
          <Image
            src={member.imageUrl || getDefaultImage()}
            alt={member.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 text-white">
            <h1 className="text-3xl font-semibold mb-2">{member.name}</h1>
            {formatDateRange(member.birthDate, member.deathDate) && (
              <p className="text-lg opacity-90">
                {formatDateRange(member.birthDate, member.deathDate)}
              </p>
            )}
            {member.gender && (
              <p className="text-sm opacity-75 capitalize mt-1">{member.gender}</p>
            )}
          </div>
        </div>
        
        {member.notes && (
          <div className="p-6">
            <p className="text-gray-700 leading-relaxed">{member.notes}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`group relative bg-white shadow-airbnb hover:shadow-airbnb-hover transition-airbnb cursor-pointer overflow-hidden rounded-lg border border-gray-200 ${
        isSelected ? 'ring-2 ring-airbnb-rausch ring-offset-2' : ''
      }`}
      onClick={() => onClick(member)}
    >
      {/* Relationship Badge */}
      {relationshipType && (
        <div className="absolute top-3 right-3 z-10">
          {getRelationshipBadge()}
        </div>
      )}

      {/* Image Section */}
      <div className="relative h-40">
        <Image
          src={member.imageUrl || getDefaultImage()}
          alt={member.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-800 mb-1 group-hover:text-airbnb-rausch transition-airbnb">
          {member.name}
        </h3>
        
        {formatDateRange(member.birthDate, member.deathDate) && (
          <p className="text-sm text-gray-600 mb-2">
            {formatDateRange(member.birthDate, member.deathDate)}
          </p>
        )}

        {member.gender && (
          <p className="text-xs text-gray-500 capitalize mb-2">{member.gender}</p>
        )}

        {member.notes && (
          <p className="text-xs text-gray-600 line-clamp-2 italic">
            {member.notes}
          </p>
        )}

        {/* Connection indicators */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          {member.parentIds && member.parentIds.filter(pid => !pid.startsWith('dummy_parent_')).length > 0 && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              Has parent{member.parentIds.filter(pid => !pid.startsWith('dummy_parent_')).length !== 1 ? 's' : ''}
            </span>
          )}
          {member.spouseId && (
            <span className="text-xs text-pink-600 bg-pink-50 px-2 py-1 rounded-full">
              Married
            </span>
          )}
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-airbnb-rausch/3 opacity-0 group-hover:opacity-100 transition-airbnb pointer-events-none" />
    </div>
  );
}

export default PersonCard;
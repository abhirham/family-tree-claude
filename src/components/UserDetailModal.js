'use client';

import { useState } from 'react';
import Image from 'next/image';

function PhotoGallery({ photos = [] }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Default photos if no photos provided
  const defaultPhotos = [
    '/api/placeholder/300/200',
    '/api/placeholder/300/201', 
    '/api/placeholder/300/202',
    '/api/placeholder/300/203'
  ];

  const displayPhotos = photos.length > 0 ? photos : defaultPhotos;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {displayPhotos.map((photo, index) => (
          <div 
            key={index}
            className="relative aspect-video rounded-lg overflow-hidden cursor-pointer hover:shadow-airbnb-hover transition-airbnb group"
            onClick={() => setSelectedPhoto(photo)}
          >
            <Image
              src={typeof photo === 'string' ? photo : photo.url}
              alt={`Family photo ${index + 1}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
        ))}
      </div>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <Image
              src={typeof selectedPhoto === 'string' ? selectedPhoto : selectedPhoto.url}
              alt="Family photo enlarged"
              fill
              className="object-contain"
            />
            <button
              className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhoto(null);
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RelationshipChips({ member, allMembers = [], onMemberClick }) {
  const getRelationships = () => {
    const relationships = [];

    // Find spouse
    if (member.spouseId) {
      const spouse = allMembers.find(m => m.id === member.spouseId);
      if (spouse) {
        relationships.push({ type: 'Spouse', person: spouse, color: 'pink' });
      }
    }

    // Find children
    const children = allMembers.filter(m => 
      m.parentIds && m.parentIds.includes(member.id)
    );
    children.forEach(child => {
      relationships.push({ type: 'Child', person: child, color: 'green' });
    });

    // Find parents
    if (member.parentIds) {
      member.parentIds.forEach(parentId => {
        if (!parentId.startsWith('dummy_parent_')) {
          const parent = allMembers.find(m => m.id === parentId);
          if (parent) {
            relationships.push({ type: 'Parent', person: parent, color: 'blue' });
          }
        }
      });
    }

    // Find siblings
    if (member.parentIds) {
      const siblings = allMembers.filter(m => 
        m.id !== member.id && 
        m.parentIds && 
        m.parentIds.some(pid => member.parentIds.includes(pid))
      );
      siblings.forEach(sibling => {
        relationships.push({ type: 'Sibling', person: sibling, color: 'purple' });
      });
    }

    return relationships;
  };

  const relationships = getRelationships();

  const getColorClasses = (color) => {
    const colorMap = {
      pink: 'bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200',
      green: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
  };

  if (relationships.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No family connections recorded
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {relationships.map((rel, index) => (
        <button
          key={index}
          onClick={() => onMemberClick && onMemberClick(rel.person)}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer ${getColorClasses(rel.color)}`}
        >
          <span className="w-6 h-6 rounded-full bg-white/50 flex items-center justify-center text-xs font-bold">
            {rel.person.name.charAt(0)}
          </span>
          <span>{rel.type}: {rel.person.name}</span>
        </button>
      ))}
    </div>
  );
}

function UserDetailModal({ member, isOpen, onClose, allMembers = [], onMemberClick }) {
  if (!isOpen || !member) return null;

  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    const date = dateObj.seconds ? new Date(dateObj.seconds * 1000) : new Date(dateObj);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatDateRange = (birthDate, deathDate) => {
    const birth = formatDate(birthDate);
    const death = formatDate(deathDate);
    
    if (birth && death) {
      return `${birth} - ${death}`;
    } else if (birth) {
      return `Born ${birth}`;
    }
    return '';
  };

  const getDefaultImage = () => {
    if (!member.id) return '/api/placeholder/120/120';
    const hash = member.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return `/api/placeholder/120/${120 + (hash % 5)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
                <Image 
                  src={member.imageUrl || getDefaultImage()} 
                  alt={member.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{member.name}</h1>
                {formatDateRange(member.birthDate, member.deathDate) && (
                  <p className="text-lg text-gray-600 mb-2">
                    {formatDateRange(member.birthDate, member.deathDate)}
                  </p>
                )}
                <div className="flex gap-2">
                  {member.gender && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                      {member.gender}
                    </span>
                  )}
                  {member.root && (
                    <span className="px-3 py-1 bg-airbnb-rausch/10 text-airbnb-rausch rounded-full text-sm font-medium">
                      Root Member
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-airbnb"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content Sections */}
          <div className="space-y-8">
            {/* Photo Gallery Section */}
            {member.photos && member.photos.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.293-1.293a2 2 0 012.828 0L20 15m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Photos
                </h2>
                <PhotoGallery photos={member.photos} />
              </div>
            )}
            
            {/* Family Relationships */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Family Connections
              </h2>
              <RelationshipChips 
                member={member} 
                allMembers={allMembers} 
                onMemberClick={onMemberClick}
              />
            </div>
            
            {/* Biography/Notes Section */}
            {member.notes && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Biography & Notes
                </h2>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{member.notes}</p>
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Member ID:</span>
                  <span className="text-blue-600 ml-2 font-mono">{member.id.slice(0, 8)}...</span>
                </div>
                {member.createdAt && (
                  <div>
                    <span className="font-medium text-blue-700">Added:</span>
                    <span className="text-blue-600 ml-2">{formatDate(member.createdAt)}</span>
                  </div>
                )}
                {member.updatedAt && (
                  <div>
                    <span className="font-medium text-blue-700">Last Updated:</span>
                    <span className="text-blue-600 ml-2">{formatDate(member.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDetailModal;
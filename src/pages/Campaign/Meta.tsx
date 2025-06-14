import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MediaItem {
  type: string;
  url: string;
  size: string;
  id: string;
}

interface LeadMagnet {
  id: number;
  name: string;
  media: MediaItem[];
  preview: string;
}

const Meta: React.FC = () => {
  const [selectedBadge, setSelectedBadge] = useState<string>('');
  const [selectedLeadMagnet, setSelectedLeadMagnet] = useState<LeadMagnet | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  
  const badges = ['VIP', 'Premium', 'Standard', 'New Customer', 'Returning'];
  
  // Generate unique IDs for media items
  const generateMediaId = () => Math.random().toString(36).substr(2, 9);
  
  const leadMagnets: LeadMagnet[] = [
    {
      id: 1,
      name: 'Free Ebook',
      preview: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80',
      media: [
        { type: 'image', url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80', size: '1.2MB', id: generateMediaId() },
        { type: 'image', url: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=400&q=80', size: '850KB', id: generateMediaId() },
        { type: 'image', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80', size: '2.1MB', id: generateMediaId() }
      ]
    },
    {
      id: 2,
      name: 'Webinar',
      preview: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=400&q=80',
      media: [
        { type: 'image', url: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=400&q=80', size: '1.5MB', id: generateMediaId() },
        { type: 'image', url: 'https://images.unsplash.com/photo-1551817958-d9d86fb29431?auto=format&fit=crop&w=400&q=80', size: '920KB', id: generateMediaId() },
        { type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-businessman-looking-at-graphics-on-a-screen-44725-large.mp4', size: '4.7MB', id: generateMediaId() }
      ]
    },
    {
      id: 3,
      name: 'Discount Coupon',
      preview: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=400&q=80',
      media: [
        { type: 'image', url: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=400&q=80', size: '1.1MB', id: generateMediaId() },
        { type: 'image', url: 'https://images.unsplash.com/photo-1607082350300-8e5a5f9dba98?auto=format&fit=crop&w=400&q=80', size: '780KB', id: generateMediaId() },
        { type: 'image', url: 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=400&q=80', size: '1.8MB', id: generateMediaId() }
      ]
    },
    {
      id: 4,
      name: 'Consultation',
      preview: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80',
      media: [
        { type: 'image', url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80', size: '1.3MB', id: generateMediaId() },
        { type: 'image', url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=400&q=80', size: '950KB', id: generateMediaId() },
        { type: 'image', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80', size: '2.2MB', id: generateMediaId() }
      ]
    },
    {
      id: 5,
      name: 'Checklist',
      preview: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=400&q=80',
      media: [
        { type: 'image', url: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=400&q=80', size: '980KB', id: generateMediaId() },
        { type: 'image', url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=400&q=80', size: '720KB', id: generateMediaId() },
        { type: 'image', url: 'https://images.unsplash.com/photo-1581291518850-49d1b1e1b7b1?auto=format&fit=crop&w=400&q=80', size: '1.6MB', id: generateMediaId() }
      ]
    },
    {
      id: 6,
      name: 'Email Course',
      preview: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=80',
      media: [
        { type: 'image', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=80', size: '1.4MB', id: generateMediaId() },
        { type: 'image', url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=400&q=80', size: '890KB', id: generateMediaId() },
        { type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-email-interface-with-icons-44712-large.mp4', size: '3.8MB', id: generateMediaId() }
      ]
    }
  ];

  // Reset selected media when lead magnet changes
  useEffect(() => {
    setSelectedMedia([]);
  }, [selectedLeadMagnet]);

  // Toggle media selection
  const toggleMediaSelection = (mediaId: string) => {
    setSelectedMedia(prev => 
      prev.includes(mediaId) 
        ? prev.filter(id => id !== mediaId) 
        : [...prev, mediaId]
    );
  };

  // Select all media for current lead magnet
  const selectAllMedia = () => {
    if (selectedLeadMagnet) {
      setSelectedMedia(selectedLeadMagnet.media.map(m => m.id));
    }
  };

  // Deselect all media
  const deselectAllMedia = () => {
    setSelectedMedia([]);
  };

  // Check if all media are selected
  const allMediaSelected = selectedLeadMagnet && 
    selectedLeadMagnet.media.length > 0 && 
    selectedLeadMagnet.media.every(m => selectedMedia.includes(m.id));

  // Simple animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  const slideUp = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const buttonHover = {
    hover: { 
      backgroundColor: '#3b82f6',
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    tap: { 
      scale: 0.98 
    }
  };

  const cardHover = {
    hover: { 
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      y: -2,
      transition: { duration: 0.2 }
    }
  };

  const mediaCardHover = {
    hover: { 
      borderColor: '#3b82f6',
      boxShadow: '0 4px 6px rgba(59, 130, 246, 0.1)',
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Badge Selection */}
      <motion.div 
        className="mb-8"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Audience Tier
        </label>
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <motion.button
              key={badge}
              className={`px-4 py-2 rounded-full border font-medium text-sm ${
                selectedBadge === badge
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
              onClick={() => setSelectedBadge(badge)}
              whileHover="hover"
              whileTap="tap"
              variants={buttonHover}
            >
              {badge}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Lead Magnet Selection */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Select Lead Magnet
        </h2>
        <div className="overflow-x-auto pb-4">
          <div className="flex space-x-4 py-2">
            {leadMagnets.map((magnet) => (
              <motion.div
                key={magnet.id}
                className={`flex-shrink-0 w-60 rounded-lg border p-3 cursor-pointer bg-white ${
                  selectedLeadMagnet?.id === magnet.id
                    ? 'border-blue-500 shadow-sm'
                    : 'border-gray-200'
                }`}
                onClick={() => setSelectedLeadMagnet(magnet)}
                whileHover="hover"
                variants={cardHover}
              >
                <div className="rounded-lg overflow-hidden w-full h-32 mb-2">
                  <img 
                    src={magnet.preview} 
                    alt={magnet.name} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h3 className="font-medium text-gray-800 text-center text-sm">
                  {magnet.name}
                </h3>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Media Display */}
      {selectedLeadMagnet && (
        <motion.div 
          className="mt-8"
          initial="hidden"
          animate="visible"
          variants={slideUp}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              Assets for <span className="text-blue-600">{selectedLeadMagnet.name}</span>
              <span className="text-sm text-gray-500 ml-2">
                ({selectedMedia.length} of {selectedLeadMagnet.media.length} selected)
              </span>
            </h2>
            
            <div className="flex gap-2">
              {!allMediaSelected ? (
                <button 
                  className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-200 bg-blue-50"
                  onClick={selectAllMedia}
                >
                  Select All
                </button>
              ) : (
                <button 
                  className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded border border-gray-200 bg-gray-50"
                  onClick={deselectAllMedia}
                >
                  Deselect All
                </button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedLeadMagnet.media.map((media) => (
              <motion.div 
                key={media.id}
                className={`rounded-lg overflow-hidden bg-white border relative cursor-pointer ${
                  selectedMedia.includes(media.id)
                    ? 'border-blue-500 border-2'
                    : 'border-gray-200'
                }`}
                onClick={() => toggleMediaSelection(media.id)}
                whileHover="hover"
                variants={mediaCardHover}
              >
                {/* Selection indicator */}
                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                  selectedMedia.includes(media.id) 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-400 border border-gray-300'
                }`}>
                  {selectedMedia.includes(media.id) && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                
                {media.type === 'image' ? (
                  <div className="w-full h-40">
                    <img 
                      src={media.url} 
                      alt={`${selectedLeadMagnet.name} media`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 relative bg-gray-900">
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <video 
                      className="w-full h-full object-cover"
                      preload="none"
                      muted
                    >
                      <source src={media.url} type="video/mp4" />
                    </video>
                  </div>
                )}
                
                <div className="p-2 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs text-gray-600 truncate">
                    {media.type === 'video' ? 'Video Asset' : 'Image Asset'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{media.size}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Run Campaign Button */}
          <div className="mt-8 flex justify-center">
            <motion.button
              className={`px-6 py-3 font-medium rounded-lg shadow-sm ${
                selectedMedia.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
              whileHover={selectedMedia.length > 0 ? { scale: 1.02 } : {}}
              whileTap={selectedMedia.length > 0 ? { scale: 0.98 } : {}}
              disabled={selectedMedia.length === 0}
            >
              Launch Campaign with {selectedMedia.length} Media
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Meta;
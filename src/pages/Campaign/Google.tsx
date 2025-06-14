import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface Location {
  state: string;
  cities: string[];
}

const Google = () => {
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [radius, setRadius] = useState(5);

  // Indian Locations grouped by State
  const locations = useMemo<Location[]>(() => [
    { state: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik'] },
    { state: 'Delhi', cities: ['New Delhi', 'Dwarka', 'Rohini'] },
    { state: 'Karnataka', cities: ['Bengaluru', 'Mysuru', 'Hubballi'] },
    { state: 'Tamil Nadu', cities: ['Chennai', 'Coimbatore', 'Madurai'] },
    { state: 'Gujarat', cities: ['Ahmedabad', 'Surat', 'Vadodara'] },
    { state: 'West Bengal', cities: ['Kolkata', 'Howrah', 'Siliguri'] },
    { state: 'Uttar Pradesh', cities: ['Lucknow', 'Kanpur', 'Agra'] },
    { state: 'Rajasthan', cities: ['Jaipur', 'Udaipur', 'Jodhpur'] },
    { state: 'Telangana', cities: ['Hyderabad', 'Warangal'] },
    { state: 'Madhya Pradesh', cities: ['Bhopal', 'Indore', 'Gwalior'] },
  ], []);

  const handleAddKeyword = () => {
    const trimmed = currentKeyword.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setCurrentKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const selectedLocation = selectedCity ? `${selectedCity}, ${selectedState}` : '';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Google Campaign</h1>
        <p className="text-gray-600">Set up your targeted Google campaign</p>
      </div>

      {/* State Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select State</label>
        <select
          value={selectedState}
          onChange={(e) => {
            setSelectedState(e.target.value);
            setSelectedCity('');
          }}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-200 focus:border-blue-500 transition"
        >
          <option value="">Select a state</option>
          {locations.map((loc, idx) => (
            <option key={idx} value={loc.state}>
              {loc.state}
            </option>
          ))}
        </select>
      </div>

      {/* City Selection */}
      {selectedState && (
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select City</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-200 focus:border-blue-500 transition"
          >
            <option value="">Select a city</option>
            {locations
              .find((loc) => loc.state === selectedState)
              ?.cities.map((city, idx) => (
                <option key={idx} value={city}>
                  {city}
                </option>
              ))}
          </select>
          {selectedCity && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-gray-600"
            >
              Selected:{" "}
              <span className="font-medium text-blue-600">{selectedLocation}</span>
            </motion.div>
          )}
        </div>
      )}

      {/* Keyword Input */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">Add Keywords</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={currentKeyword}
            onChange={(e) => setCurrentKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type keyword and press Enter"
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddKeyword}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </motion.button>
        </div>

        {/* Keyword Chips */}
        {keywords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {keywords.map((kw, i) => (
              <motion.div
                key={i}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
              >
                {kw}
                <button
                  onClick={() => handleRemoveKeyword(kw)}
                  className="ml-2 text-blue-600 hover:text-blue-900 focus:outline-none"
                >
                  &times;
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Radius Selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Radius: <span className="text-blue-600">{radius} km</span>
        </label>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">1 km</span>
          <input
            type="range"
            min="1"
            max="100"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <span className="text-gray-500 text-sm">100 km</span>
        </div>
        <div className="mt-2 grid grid-cols-10 gap-1 text-xs text-gray-500">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="text-center">{(i + 1) * 10}</div>
          ))}
        </div>
      </div>

      {/* Preview Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-10 p-6 bg-gray-50 rounded-xl border border-gray-200"
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Campaign Preview</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600">Target Location</h3>
            <p className="text-gray-800">{selectedLocation || <span className="text-gray-400">No location selected</span>}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">Target Keywords</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {keywords.length > 0 ? (
                keywords.map((kw, i) => (
                  <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {kw}
                  </span>
                ))
              ) : (
                <span className="text-gray-400">No keywords added</span>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">Target Radius</h3>
            <p className="text-gray-800">
              {radius} km around {selectedLocation || 'selected location'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Launch Button */}
      <div className="mt-8 flex justify-center">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={!selectedState || !selectedCity || keywords.length === 0}
          className={`px-8 py-3 font-medium rounded-lg shadow-md transition-colors ${
            selectedState && selectedCity && keywords.length > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          Launch Google Campaign
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block ml-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
};

export default Google;

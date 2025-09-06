import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// Use localStorage instead of global variable
const getKey = () => localStorage.getItem('encryption_key') || "No key entered";
const setKey = (newKey) => localStorage.setItem('encryption_key', newKey);

var key = getKey(); // For backward compatibility

const LogOut = () => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [keyStatus, setKeyStatus] = useState('');

  // Update key when localStorage changes
  useEffect(() => {
    key = getKey();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      // Clear the key on sign out
      localStorage.removeItem('encryption_key');
      key = "No key entered";
    }
  }

  const handleKeySet = () => {
    if (tempKey.trim()) {
      setKey(tempKey.trim());
      key = tempKey.trim(); // Update global variable
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('encryptionKeyChanged', {
        detail: { newKey: tempKey.trim() }
      }));
      
      setTempKey('');
      setShowKeyModal(false);
      setKeyStatus('Key set successfully! 🔐');
      // Clear success message after 3 seconds
      setTimeout(() => setKeyStatus(''), 3000);
    }
  };

  const openKeyModal = () => {
    setShowKeyModal(true);
    setTempKey(key === "No key entered" ? '' : key);
  };
  
  return (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <button
          onClick={openKeyModal}
          className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          title="Set your encryption key"
        >
          🔑 Set Key
        </button>
        {keyStatus && (
          <div className="absolute top-full right-0 mt-2 px-3 py-1 bg-green-100 border border-green-300 rounded-md text-green-700 text-xs whitespace-nowrap z-10">
            {keyStatus}
          </div>
        )}
      </div>
      
      <button
        onClick={signOut}
        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
      >
        Sign Out
      </button>

      {/* Key Setting Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-8 bg-white w-full max-w-md m-auto rounded-lg shadow-lg">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Set Encryption Key 🔐
              </h3>
              <p className="text-sm text-gray-600">
                This key is used to encrypt and decrypt your messages. Keep it secure!
              </p>
            </div>
            
            <input
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your encryption key..."
              autoFocus
            />
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowKeyModal(false);
                  setTempKey('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleKeySet}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                disabled={!tempKey.trim()}
              >
                Set Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export {key};
export default LogOut;
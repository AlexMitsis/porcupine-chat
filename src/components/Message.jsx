import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// Use localStorage for encryption key
const getKey = () => localStorage.getItem('encryption_key') || "No key entered";

const Message = ({ message }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [decryptionResult, setDecryptionResult] = useState('[Loading...]');
  const [shouldRender, setShouldRender] = useState(true);
  const [currentKey, setCurrentKey] = useState(getKey());
  
  // Always call hooks first
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };
    getUser();
  }, []);

  // Listen for encryption key changes
  useEffect(() => {
    const handleKeyChanged = (event) => {
      setCurrentKey(event.detail.newKey);
    };

    const handleStorageChange = () => {
      setCurrentKey(getKey());
    };

    // Listen for custom key change event
    window.addEventListener('encryptionKeyChanged', handleKeyChanged);
    
    // Listen for storage changes (cross-tab)
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('encryptionKeyChanged', handleKeyChanged);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const decryptMessage = async () => {
      
      // Check if message is valid
      if (!message || !message.text || !message.id || typeof message.text !== 'string' || message.text.length === 0) {
        setDecryptionResult('[Invalid message]');
        setShouldRender(false);
        return;
      }

      setShouldRender(true);

      // Get current encryption key
      if (!currentKey || currentKey === "No key entered") {
        setDecryptionResult('[Set encryption key to view messages]');
        return;
      }

      try {
        const CryptoJS = await import('crypto-js');
        const decryptedBytes = CryptoJS.AES.decrypt(message.text, currentKey);
        
        if (decryptedBytes.sigBytes <= 0) {
          setDecryptionResult('[Wrong key - cannot decrypt]');
          return;
        }

        let decryptedText;
        try {
          decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);
        } catch (utf8Error) {
          console.error('UTF-8 conversion error:', utf8Error);
          setDecryptionResult('[Wrong key - corrupted data]');
          return;
        }
        
        if (!decryptedText || decryptedText.length === 0) {
          setDecryptionResult('[Wrong key - empty result]');
          return;
        }

        setDecryptionResult(decryptedText);
      } catch (error) {
        console.error('Decryption error:', error);
        setDecryptionResult('[Decryption failed - wrong key?]');
      }
    };

    decryptMessage();
  }, [message, currentKey]);

  // Early return after all hooks
  if (!shouldRender) {
    return null;
  }

  const isOwnMessage = currentUser && message && message.uid === currentUser.id;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-end gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Profile Picture */}
        <div className="w-8 h-8 rounded-full flex-shrink-0">
          {currentUser && message && 
            ((isOwnMessage && currentUser.user_metadata?.avatar_url) || 
             (!isOwnMessage && message.avatar_url)) ? (
            <img 
              src={isOwnMessage ? currentUser.user_metadata.avatar_url : message.avatar_url} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium text-sm">
                {isOwnMessage 
                  ? (currentUser?.user_metadata?.full_name || currentUser?.email || 'You').charAt(0).toUpperCase()
                  : (message.name || 'U').charAt(0).toUpperCase()
                }
              </span>
            </div>
          )}
        </div>
        
        {/* Message Bubble */}
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
          isOwnMessage 
            ? 'bg-blue-500 text-white rounded-br-none' 
            : 'bg-white text-gray-800 rounded-bl-none border'
        }`}>
          {!isOwnMessage && (
            <div className="text-xs font-semibold text-gray-600 mb-1">
              {message.name}
            </div>
          )}
          <div className="break-words">
            {decryptionResult || '[Empty message]'}
          </div>
          <div className={`text-xs mt-1 ${
            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {formatTime(message.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
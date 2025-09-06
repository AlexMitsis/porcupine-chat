import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'

// Use localStorage for encryption key
const getKey = () => localStorage.getItem('encryption_key') || "No key entered";

const SendMessage = ({ onMessageSent }) => {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [currentKey, setCurrentKey] = useState(getKey());
  const [forceRender, setForceRender] = useState(0);

  // Update key state when localStorage changes
  useEffect(() => {
    const handleKeyChanged = (event) => {
      setCurrentKey(event.detail.newKey);
    };

    const handleStorageChange = () => {
      setCurrentKey(getKey());
    };

    // Listen for custom event and storage changes
    window.addEventListener('encryptionKeyChanged', handleKeyChanged);
    window.addEventListener('storage', handleStorageChange);
    
    // Aggressive polling to catch changes
    const interval = setInterval(() => {
      const newKey = getKey();
      if (newKey !== currentKey) {
        setCurrentKey(newKey);
      }
    }, 50);

    return () => {
      window.removeEventListener('encryptionKeyChanged', handleKeyChanged);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [currentKey]);

  // Force re-render on every tick to detect key changes
  useEffect(() => {
    const interval = setInterval(() => {
      const newKey = getKey();
      if (newKey !== currentKey) {
        setCurrentKey(newKey);
        setForceRender(prev => prev + 1); // Force re-render
      }
    }, 10);

    return () => clearInterval(interval);
  });

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (input.trim() === '') {
        return;
    }

    const key = getKey();
    if (key === "No key entered") {
        alert('Please set your encryption key first using the "Set Key" button');
        return;
    }

    setSending(true);

    try {
      const CryptoJS = require('crypto-js');
      const encryptedString = CryptoJS.AES.encrypt(input.trim(), key).toString();
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
          alert('Please sign in to send messages');
          return;
      }
      
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          text: encryptedString,
          name: user.user_metadata.full_name || user.email,
          uid: user.id,
          avatar_url: user.user_metadata.avatar_url || null
        }])
        .select()
        .single();
      
      if (error) {
          console.error('Error sending message:', error);
          alert('Error sending message. Please try again.');
          return;
      }
      
      console.log('Message sent successfully:', data);
      
      // Notify parent component that a message was sent
      if (onMessageSent) {
        onMessageSent(data);
      }
      
      setInput('');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={sendMessage} className="flex gap-2">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        type='text'
        placeholder={currentKey === "No key entered" ? "Set encryption key first..." : "Type your message..."}
        disabled={sending || currentKey === "No key entered"}
        maxLength={500}
      />
      <button 
        className={`px-6 py-2 rounded-lg font-medium transition-all ${
          sending || input.trim() === '' || currentKey === "No key entered"
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
        }`}
        type='submit'
        disabled={sending || input.trim() === '' || currentKey === "No key entered"}
      >
        {sending ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Sending</span>
          </div>
        ) : (
          'Send'
        )}
      </button>
    </form>
  );
};

export default SendMessage;

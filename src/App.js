import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import RoomSelection from './components/RoomSelection';
import RoomChat from './components/RoomChat';
import { supabase } from './supabase';
import { parseInviteLink } from './utils/crypto';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [inviteInfo, setInviteInfo] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Check for invite link in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('code')) {
      const invite = parseInviteLink(window.location.href);
      if (invite) {
        setInviteInfo(invite);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
    
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center transition-colors duration-200">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-600 dark:text-dark-400">Loading...</div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 transition-colors duration-200">
      <Navbar />
      {user ? (
        selectedRoom ? (
          <RoomChat 
            user={user} 
            room={selectedRoom} 
            onLeaveRoom={() => setSelectedRoom(null)} 
          />
        ) : (
          <RoomSelection 
            user={user} 
            onRoomSelected={setSelectedRoom}
            inviteInfo={inviteInfo}
            onInviteProcessed={() => setInviteInfo(null)}
          />
        )
      ) : (
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="text-center max-w-md mx-auto animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-r from-accent-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce-in">
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to Porcupine <span className="text-gray-400 dark:text-dark-400 font-normal">v2</span>
            </h1>
            <p className="text-gray-600 dark:text-dark-300 mb-8">
              Secure room-based messaging with end-to-end encryption. 
              Sign in with Google to create or join encrypted chat rooms.
            </p>
            <div className="space-y-4">
              <div className="flex items-center text-sm text-gray-500 dark:text-dark-400">
                <span className="mr-2">🏠</span>
                <span>Create private rooms or join with invite codes</span>
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-dark-400">
                <span className="mr-2">🔐</span>
                <span>X25519 + AES-256-GCM end-to-end encryption</span>
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-dark-400">
                <span className="mr-2">⚡</span>
                <span>Real-time messaging powered by Supabase</span>
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-dark-400">
                <span className="mr-2">🔗</span>
                <span>Shareable invite links and room codes</span>
              </div>
            </div>
            {inviteInfo && (
              <div className="mt-6 p-4 bg-accent-50 dark:bg-dark-800 border border-accent-200 dark:border-dark-700 rounded-lg animate-slide-up">
                <div className="text-sm text-accent-800 dark:text-accent-300">
                  You've been invited to join: <strong>{inviteInfo.name || 'a room'}</strong>
                </div>
                <div className="text-xs text-accent-600 dark:text-accent-400 mt-1">
                  Sign in to join with code: <code className="font-mono bg-accent-100 dark:bg-dark-700 px-1 rounded">{inviteInfo.code}</code>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </ThemeProvider>
  );
}

export default App;

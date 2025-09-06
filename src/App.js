import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Chat from './components/Chat';
import { supabase } from './supabase';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {user ? (
        <Chat />
      ) : (
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Porcupine <span className="text-gray-400 font-normal">v2</span>
            </h1>
            <p className="text-gray-600 mb-8">
              End-to-end encrypted messaging with real-time updates. 
              Sign in with Google to start chatting securely.
            </p>
            <div className="space-y-4">
              <div className="flex items-center text-sm text-gray-500">
                <span className="mr-2">🔒</span>
                <span>Messages are encrypted with your personal key</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="mr-2">⚡</span>
                <span>Real-time messaging powered by Supabase</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="mr-2">🌐</span>
                <span>Simple Google authentication</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

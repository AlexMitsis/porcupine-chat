import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import SignIn from "./SignIn";
import LogOut from "./LogOut";
import DarkModeToggle from "./DarkModeToggle";

function Navbar() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="bg-white dark:bg-dark-900 shadow-md border-b border-gray-200 dark:border-dark-700 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-accent-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">🔐</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Porcupine <span className="text-gray-400 dark:text-dark-400 font-normal">v2</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden sm:flex items-center space-x-3 text-sm text-gray-600 dark:text-dark-300">
                <div className="w-8 h-8 bg-gray-300 dark:bg-dark-600 rounded-full flex items-center justify-center">
                  {user.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <span className="text-gray-600 dark:text-dark-300 font-medium">
                      {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="font-medium">
                  {user.user_metadata?.full_name || user.email}
                </span>
              </div>
            )}
            <DarkModeToggle />
            {user ? <LogOut /> : <SignIn />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar;

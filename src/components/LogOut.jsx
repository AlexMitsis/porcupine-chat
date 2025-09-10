import React from 'react'
import { supabase } from '../supabase'

const LogOut = () => {
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  }
  
  return (
    <button
      onClick={signOut}
      className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-dark-600 text-sm font-medium rounded-md text-gray-700 dark:text-dark-200 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-accent-500 dark:focus:ring-accent-400 transition-colors"
    >
      Sign Out
    </button>
  )
}

export default LogOut;
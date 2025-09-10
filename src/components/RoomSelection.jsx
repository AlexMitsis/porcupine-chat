import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { generateKeyPair, generateRoomCode, generateInviteLink } from '../utils/crypto';

const RoomSelection = ({ user, onRoomSelected, inviteInfo, onInviteProcessed }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      // Fetch rooms the user is a member of
      const { data, error } = await supabase
        .from('room_members')
        .select(`
          room_id,
          joined_at,
          rooms!inner (
            id,
            name,
            room_code,
            created_by,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching rooms:', error);
        setError('Failed to load rooms');
      } else {
        const roomList = data.map(item => ({
          ...item.rooms,
          joined_at: item.joined_at,
          is_creator: item.rooms.created_by === user.id
        }));
        setRooms(roomList);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) {
      setError('Room name is required');
      return;
    }

    try {
      setError('');
      const roomCode = generateRoomCode();
      const keyPair = await generateKeyPair();
      
      // Store room keypair locally
      localStorage.setItem(`room_${roomCode}_keypair`, JSON.stringify({
        privateKey: keyPair.privateKey,
        publicKey: keyPair.publicKey
      }));
      
      // Create room in database
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: newRoomName,
          room_code: roomCode,
          created_by: user.id
        })
        .select()
        .single();

      if (roomError) {
        console.error('Error creating room:', roomError);
        setError('Failed to create room');
        return;
      }

      // Add creator as room member
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: roomData.id,
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email,
          public_key: keyPair.publicKey
        });

      if (memberError) {
        console.error('Error adding room member:', memberError);
        setError('Room created but failed to add you as member');
        return;
      }

      setSuccess(`Room "${newRoomName}" created successfully! Room code: ${roomCode}`);
      setNewRoomName('');
      setShowCreateModal(false);
      fetchRooms(); // Refresh room list
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Failed to create room');
    }
  };

  const joinRoom = async () => {
    if (!joinRoomCode.trim()) {
      setError('Room code is required');
      return;
    }

    try {
      setError('');
      
      // Find room by code
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', joinRoomCode.toUpperCase())
        .single();

      if (roomError) {
        if (roomError.code === 'PGRST116') {
          setError('Room not found. Check the room code and try again.');
        } else {
          console.error('Error finding room:', roomError);
          setError('Failed to find room');
        }
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('room_members')
        .select('id')
        .eq('room_id', roomData.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        setError('You are already a member of this room');
        return;
      }

      // Generate keypair for this room
      const keyPair = await generateKeyPair();
      localStorage.setItem(`room_${roomData.room_code}_keypair`, JSON.stringify({
        privateKey: keyPair.privateKey,
        publicKey: keyPair.publicKey
      }));

      // Add user to room
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: roomData.id,
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email,
          public_key: keyPair.publicKey
        });

      if (memberError) {
        console.error('Error joining room:', memberError);
        setError('Failed to join room');
        return;
      }

      setSuccess(`Successfully joined room "${roomData.name}"!`);
      setJoinRoomCode('');
      setShowJoinModal(false);
      fetchRooms(); // Refresh room list
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Failed to join room');
    }
  };

  const showInviteLink = (room) => {
    setSelectedRoom(room);
    setShowInviteModal(true);
  };

  const copyInviteLink = () => {
    if (selectedRoom) {
      const link = generateInviteLink(selectedRoom.room_code, selectedRoom.name);
      navigator.clipboard.writeText(link);
      setSuccess('Invite link copied to clipboard!');
    }
  };

  useEffect(() => {
    fetchRooms();
    
    // Handle invite link if provided
    if (inviteInfo && !showJoinModal) {
      setJoinRoomCode(inviteInfo.code);
      setShowJoinModal(true);
      if (onInviteProcessed) {
        onInviteProcessed();
      }
    }
    
    // Set up real-time subscription for room updates
    const channel = supabase
      .channel('room_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        fetchRooms();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members' }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user.id, inviteInfo]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">Loading rooms...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-dark-950 p-6 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Your Chat Rooms</h1>
          <p className="text-gray-600 dark:text-dark-300">Create a new room or join an existing one to start chatting</p>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-accent-600 text-white rounded-lg font-medium hover:bg-accent-700 transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
          >
            <span>➕</span>
            <span>Create Room</span>
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-6 py-3 bg-success-600 text-white rounded-lg font-medium hover:bg-success-700 transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
          >
            <span>🔗</span>
            <span>Join Room</span>
          </button>
        </div>

        {/* Error/Success messages */}
        {error && (
          <div className="mb-6 p-4 bg-error-50 dark:bg-error-500/20 border border-error-300 dark:border-error-500/30 text-error-700 dark:text-error-300 rounded-lg text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-success-50 dark:bg-success-500/20 border border-success-300 dark:border-success-500/30 text-success-700 dark:text-success-300 rounded-lg text-center">
            {success}
          </div>
        )}

        {/* Rooms list */}
        {rooms.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏠</div>
            <div className="text-xl text-gray-500 dark:text-dark-400 mb-2">No rooms yet</div>
            <div className="text-gray-400 dark:text-dark-500">Create your first room or join an existing one to get started</div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white dark:bg-dark-800 rounded-lg shadow-md dark:shadow-xl p-6 border border-gray-200 dark:border-dark-600 hover:shadow-lg dark:hover:shadow-2xl transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">{room.name}</h3>
                  {room.is_creator && (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-accent-100 dark:bg-accent-600/30 text-accent-800 dark:text-accent-300 rounded">
                      Creator
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-500 dark:text-dark-400 mb-4 space-y-1">
                  <div>Code: <span className="font-mono font-medium">{room.room_code}</span></div>
                  <div>Joined: {room.joined_at ? new Date(room.joined_at).toLocaleDateString() : 'Unknown'}</div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => onRoomSelected(room)}
                    className="flex-1 px-4 py-2 bg-accent-600 dark:bg-accent-700 text-white rounded-md text-sm font-medium hover:bg-accent-700 dark:hover:bg-accent-800 transition-colors shadow-sm hover:shadow-md"
                  >
                    Enter Room
                  </button>
                  {room.is_creator && (
                    <button
                      onClick={() => showInviteLink(room)}
                      className="px-4 py-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-200 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
                      title="Share invite link"
                    >
                      📤
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Room Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 dark:bg-dark-900/80 bg-opacity-50 dark:bg-opacity-90 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl dark:shadow-2xl p-6 w-full max-w-md border dark:border-dark-600">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Create New Room</h2>
              <input
                type="text"
                placeholder="Enter room name..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 mb-4"
                autoFocus
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {setShowCreateModal(false); setNewRoomName(''); setError('');}}
                  className="px-4 py-2 text-gray-700 dark:text-dark-200 bg-gray-100 dark:bg-dark-700 rounded-md hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createRoom}
                  disabled={!newRoomName.trim()}
                  className="px-4 py-2 bg-accent-600 text-white rounded-md hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Room
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join Room Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-gray-600 dark:bg-dark-900/80 bg-opacity-50 dark:bg-opacity-90 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl dark:shadow-2xl p-6 w-full max-w-md border dark:border-dark-600">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Join Room</h2>
              <input
                type="text"
                placeholder="Enter room code..."
                value={joinRoomCode}
                onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 mb-4 font-mono"
                autoFocus
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {setShowJoinModal(false); setJoinRoomCode(''); setError('');}}
                  className="px-4 py-2 text-gray-700 dark:text-dark-200 bg-gray-100 dark:bg-dark-700 rounded-md hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={joinRoom}
                  disabled={!joinRoomCode.trim()}
                  className="px-4 py-2 bg-success-600 text-white rounded-md hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Join Room
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Link Modal */}
        {showInviteModal && selectedRoom && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
              <h2 className="text-xl font-semibold mb-4">Share Room: {selectedRoom.name}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Room Code:</label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 px-3 py-2 bg-gray-100 border rounded-md font-mono text-lg">
                      {selectedRoom.room_code}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedRoom.room_code);
                        setSuccess('Room code copied!');
                      }}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      title="Copy room code"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invite Link:</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={generateInviteLink(selectedRoom.room_code, selectedRoom.name)}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-100 border rounded-md text-sm"
                    />
                    <button
                      onClick={copyInviteLink}
                      className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomSelection;
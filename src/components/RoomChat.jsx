import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { encryptMessage, decryptMessage, getSharedSecret } from '../utils/crypto';

const RoomChat = ({ user, room, onLeaveRoom }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [roomMembers, setRoomMembers] = useState([]);
  const [sharedSecrets, setSharedSecrets] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchRoomMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('room_members')
        .select('user_id, user_name, public_key')
        .eq('room_id', room.id);

      if (error) {
        console.error('Error fetching room members:', error);
        return;
      }

      setRoomMembers(data);

      // Generate shared secrets with all room members
      const myKeyPair = JSON.parse(localStorage.getItem(`room_${room.room_code}_keypair`) || '{}');
      if (!myKeyPair.privateKey) {
        console.error('No keypair found for this room - generating new one');
        // Try to regenerate keypair if missing
        try {
          const { generateKeyPair } = await import('../utils/crypto');
          const newKeyPair = await generateKeyPair();
          localStorage.setItem(`room_${room.room_code}_keypair`, JSON.stringify({
            privateKey: newKeyPair.privateKey,
            publicKey: newKeyPair.publicKey
          }));
          
          // Update room member with new public key
          const { error: updateError } = await supabase
            .from('room_members')
            .update({ public_key: newKeyPair.publicKey })
            .eq('room_id', room.id)
            .eq('user_id', user.id);
          
          if (updateError) {
            console.error('Failed to update public key:', updateError);
          } else {
            // Retry fetching room members with new keypair
            fetchRoomMembers();
          }
        } catch (error) {
          console.error('Failed to regenerate keypair:', error);
        }
        return;
      }

      const secrets = {};
      for (const member of data) {
        if (member.user_id !== user.id) {
          try {
            secrets[member.user_id] = await getSharedSecret(myKeyPair.privateKey, member.public_key);
          } catch (error) {
            console.error(`Failed to generate shared secret with ${member.user_name}:`, error);
          }
        }
      }
      setSharedSecrets(secrets);
    } catch (error) {
      console.error('Error fetching room members:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Decrypt messages
      const decryptedMessages = await Promise.all(data.map(async (msg) => {
        if (msg.encrypted_content && msg.nonce) {
          let decryptedText = '[Unable to decrypt]';
          
          if (msg.uid === user.id) {
            // Our own message - try decrypting with our own shared secret (use first available)
            const firstSecret = Object.values(sharedSecrets)[0];
            if (firstSecret) {
              decryptedText = await decryptMessage(msg.encrypted_content, msg.nonce, firstSecret);
            }
          } else {
            // Someone else's message - use shared secret with that user
            const secret = sharedSecrets[msg.uid];
            if (secret) {
              decryptedText = await decryptMessage(msg.encrypted_content, msg.nonce, secret);
            }
          }

          return {
            ...msg,
            text: decryptedText,
            isEncrypted: true
          };
        } else {
          // Legacy unencrypted message
          return {
            ...msg,
            isEncrypted: false
          };
        }
      }));

      setMessages(decryptedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);

      // Get the first available shared secret for encryption
      // In a real implementation, you'd want a more sophisticated key management system
      const firstSecret = Object.values(sharedSecrets)[0];
      if (!firstSecret) {
        console.error('No shared secret available for encryption');
        return;
      }

      // Encrypt the message
      const encrypted = await encryptMessage(newMessage.trim(), firstSecret);

      const messageData = {
        encrypted_content: encrypted.ciphertext,
        nonce: encrypted.nonce,
        name: user.user_metadata?.full_name || user.email,
        uid: user.id,
        room_id: room.id,
        text: null, // Don't store plaintext
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid time';
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString();
  };

  useEffect(() => {
    fetchRoomMembers();
  }, [room.id]);

  useEffect(() => {
    if (roomMembers.length > 0) {
      fetchMessages();
    }
  }, [roomMembers, sharedSecrets]);

  useEffect(() => {
    if (roomMembers.length === 0) return;

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel(`room_${room.id}_messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${room.id}`
        },
        async (payload) => {
          console.log('New message received:', payload.new);
          
          // Decrypt the new message
          let decryptedText = '[Unable to decrypt]';
          if (payload.new.encrypted_content && payload.new.nonce) {
            if (payload.new.uid === user.id) {
              // Our own message
              const firstSecret = Object.values(sharedSecrets)[0];
              if (firstSecret) {
                decryptedText = await decryptMessage(payload.new.encrypted_content, payload.new.nonce, firstSecret);
              }
            } else {
              // Someone else's message
              const secret = sharedSecrets[payload.new.uid];
              if (secret) {
                decryptedText = await decryptMessage(payload.new.encrypted_content, payload.new.nonce, secret);
              }
            }
          }

          const decryptedMessage = {
            ...payload.new,
            text: decryptedText,
            isEncrypted: !!payload.new.encrypted_content
          };

          setMessages(current => {
            if (current.some(msg => msg.id === decryptedMessage.id)) {
              return current;
            }
            return [...current, decryptedMessage];
          });
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [room.id, user.id, sharedSecrets]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-dark-900 pt-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-dark-300">Loading messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-dark-900">
      {/* Room header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onLeaveRoom}
              className="text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-200 transition-colors"
              title="Back to rooms"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-dark-100">{room.name}</h1>
              <p className="text-sm text-gray-500 dark:text-dark-400">
                {roomMembers.length} member{roomMembers.length !== 1 ? 's' : ''} • 
                Code: <span className="font-mono">{room.room_code}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              🔐 End-to-End Encrypted
            </span>
            <div className="text-sm text-gray-500 dark:text-dark-400">
              {roomMembers.filter(m => m.user_id !== user.id).length} peer{roomMembers.filter(m => m.user_id !== user.id).length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-dark-400 py-8">
            <div className="text-6xl mb-4">🔒</div>
            <div className="text-lg">Room is secured and ready</div>
            <div className="text-sm">All messages are end-to-end encrypted</div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1];
              const showDate = !prevMessage || formatDate(message.created_at) !== formatDate(prevMessage.created_at);
              
              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center my-4">
                      <span className="inline-block px-3 py-1 bg-gray-200 dark:bg-dark-700 text-gray-600 dark:text-dark-300 text-xs rounded-full">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                  )}
                  
                  <div className={`flex ${message.uid === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.uid === user.id
                        ? 'bg-blue-600 dark:bg-blue-700 text-white'
                        : 'bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 border border-gray-200 dark:border-dark-600'
                    }`}>
                      {message.uid !== user.id && (
                        <div className="text-xs font-medium mb-1 opacity-75">
                          {message.name}
                        </div>
                      )}
                      <div className="break-words">{message.text}</div>
                      <div className={`text-xs mt-1 flex items-center justify-between ${
                        message.uid === user.id ? 'text-blue-200 dark:text-blue-300' : 'text-gray-500 dark:text-dark-400'
                      }`}>
                        <span>{formatTime(message.created_at)}</span>
                        {message.isEncrypted && (
                          <span className="ml-2" title="End-to-end encrypted">🔐</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-dark-700 p-4">
        <form onSubmit={sendMessage} className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={sending || Object.keys(sharedSecrets).length === 0}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100 placeholder-gray-500 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50"
            autoFocus
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || Object.keys(sharedSecrets).length === 0}
            className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
        
        {Object.keys(sharedSecrets).length === 0 && roomMembers.length > 1 && (
          <div className="text-center text-sm text-red-600 dark:text-red-400 mt-2">
            Unable to establish secure connection. Please refresh the page.
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomChat;
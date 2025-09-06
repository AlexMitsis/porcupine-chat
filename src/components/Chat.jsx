import React, {useState, useEffect, useRef} from 'react'
import Message from './Message'
import SendMessage from './SendMessage'
import ErrorBoundary from './ErrorBoundary'
import { supabase } from '../supabase'

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleMessageSent = (newMessage) => {
    console.log('Message sent callback:', newMessage);
    // The real-time subscription should handle this, but as fallback:
    setMessages(current => {
      if (current.some(msg => msg.id === newMessage.id)) {
        return current;
      }
      return [...current, newMessage];
    });
    setTimeout(scrollToBottom, 100);
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('Error fetching messages:', error);
        } else {
          setMessages(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel('public:messages', {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        },
        (payload) => {
          console.log('New message received via realtime:', payload.new);
          setMessages(current => {
            // Avoid duplicates
            if (current.some(msg => msg.id === payload.new.id)) {
              return current;
            }
            return [...current, payload.new];
          });
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-6xl mb-4">💬</div>
            <div className="text-lg">No messages yet</div>
            <div className="text-sm">Be the first to send a message!</div>
          </div>
        ) : (
          messages.map((message) => (
            <ErrorBoundary key={message.id}>
              <Message message={message} />
            </ErrorBoundary>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Send Message Component */}
      <div className="border-t bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <SendMessage onMessageSent={handleMessageSent} />
        </div>
      </div>
    </div>
  );
};

export default Chat;
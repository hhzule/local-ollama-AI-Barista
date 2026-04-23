'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Type definitions
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Order {
  [key: string]: any; // Flexible type for order structure
}

interface AIResponse {
  message: string;
  current_order: Order | null;
  suggestions: string[];
  progress: 'in_progress' | 'completed' | string;
}

const StarbucksBarista: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [threadId, setThreadId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Initialize thread ID on client side only (to avoid hydration mismatch)
  useEffect(() => {
    const storedThreadId = localStorage.getItem('barista_thread');
    if (storedThreadId) {
      setThreadId(storedThreadId);
    } else {
      const newThreadId = `thread_${Date.now()}_${Math.random()}`;
      setThreadId(newThreadId);
      localStorage.setItem('barista_thread', newThreadId);
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || !threadId) return;
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats/message/${threadId}`,{
        method:'POST',
         headers: {
      'Content-Type': 'application/json',  // ← This was missing!
    },
        body: JSON.stringify({ query: input })
      })
      // axios.post<AIResponse>(
      //   `${process.env.NEXT_PUBLIC_API_URL}/chats/message/${threadId}`,
      //   { query: input }
      // );
  console.log("response", response)
  console.log("response status:", response.status);
console.log("response headers:", response.headers);

// Get raw text first, don't try to parse as JSON yet
const rawResponse = await response.text();
console.log("RAW RESPONSE:", rawResponse);
console.log("RAW RESPONSE TYPE:", typeof rawResponse);
console.log("RAW RESPONSE LENGTH:", rawResponse.length);
    const aiResponse = JSON.parse(rawResponse);
      console.log("aiResponse", aiResponse)
      // Add AI message to chat
      // const aiMessage: Message = { 
      //   role: 'assistant', 
      //   content: aiResponse.data.message 
      // };
      // setMessages(prev => [...prev, aiMessage]);
      
      // // Update order status
      // setCurrentOrder(aiResponse.current_order);
      // setSuggestions(aiResponse.suggestions || []);
      
      // // Check if order is completed
      // if (aiResponse.progress === 'completed') {
      //   alert('Your order has been placed! 🎉');
      //   // Reset order display after completion (optional)
      //   setTimeout(() => {
      //     setCurrentOrder(null);
      //     setSuggestions([]);
      //   }, 3000);
      // }

    } catch (error) {
      console.error('Error:', error);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          errorMessage = 'Invalid request. Please try again.';
        } else if (error.code === 'ECONNREFUSED') {
          errorMessage = 'Cannot connect to the server. Please make sure the backend is running.';
        }
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage 
      }]);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  if (!threadId) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="starbucks-barista">
      <h2>☕ Starbucks AI Barista</h2>
      
      {/* Current Order Display */}
      {currentOrder && Object.keys(currentOrder).length > 0 && (
        <div className="current-order">
          <h3>Your Current Order:</h3>
          <pre>{JSON.stringify(currentOrder, null, 2)}</pre>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="suggestions">
          <h3>Suggestions:</h3>
          <div className="suggestion-buttons">
            {suggestions.map((suggestion, idx) => (
              <button 
                key={idx} 
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={loading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <strong>{msg.role === 'user' ? 'You' : 'Barista'}:</strong>
            <p>{msg.content}</p>
          </div>
        ))}
        {loading && (
          <div className="loading-message">
            <div className="dots">
              <span>.</span><span>.</span><span>.</span>
            </div>
            Barista is thinking... ☕
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Say something like: 'I want a vanilla latte with oat milk'"
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      <style jsx>{`
        .starbucks-barista {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-size: 18px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        h2 {
          color: #006241;
          text-align: center;
          margin-bottom: 20px;
        }

        .current-order {
          background-color: #f5f5f5;
          border-left: 4px solid #006241;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }

        .current-order h3 {
          margin: 0 0 10px 0;
          color: #006241;
        }

        .current-order pre {
          background-color: #fff;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
        }

        .suggestions {
          margin: 20px 0;
        }

        .suggestions h3 {
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
        }

        .suggestion-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .suggestion-buttons button {
          background-color: #f0f0f0;
          color: #333;
          border: 1px solid #ddd;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .suggestion-buttons button:hover:not(:disabled) {
          background-color: #006241;
          color: white;
          border-color: #006241;
        }

        .suggestion-buttons button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chat-messages {
          height: 400px;
          overflow-y: auto;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          background-color: #fafafa;
        }

        .message {
          margin: 10px 0;
          padding: 10px 15px;
          border-radius: 8px;
          max-width: 80%;
        }

        .message.user {
          background-color: #006241;
          color: white;
          margin-left: auto;
          text-align: right;
        }

        .message.assistant {
          background-color: white;
          border: 1px solid #e0e0e0;
          margin-right: auto;
        }

        .message strong {
          font-size: 12px;
          opacity: 0.8;
        }

        .message p {
          margin: 5px 0 0 0;
        }

        .loading-message {
          text-align: center;
          color: #666;
          font-style: italic;
          padding: 10px;
        }

        .dots span {
          animation: blink 1.4s infinite both;
        }

        .dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes blink {
          0%, 20%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }

        .input-area {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .input-area input {
          flex: 1;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .input-area input:focus {
          outline: none;
          border-color: #006241;
        }

        .input-area button {
          background-color: #006241;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: background-color 0.2s;
        }

        .input-area button:hover:not(:disabled) {
          background-color: #004d33;
        }

        .input-area button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default StarbucksBarista;
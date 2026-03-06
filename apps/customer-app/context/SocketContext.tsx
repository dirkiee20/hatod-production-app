import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE, getAuthToken } from '../api/client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const initSocket = async () => {
      const token = await getAuthToken();
      if (!token) {
        // No auth token yet (login/signup flow), so skip socket init.
        return;
      }
      
      const baseUrl = API_BASE.replace(/\/api\/?$/, '');

      // Create socket connection
      const newSocket = io(`${baseUrl}/events`, {
        path: '/socket.io',
        auth: {
          token: token
        },
        transports: ['polling', 'websocket'], // Allow polling first, then upgrade to websocket
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000, // Increase timeout
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (err) => {
        console.error('⚠️ Socket connect_error:', err.message);
        // If websocket fails, try polling? (Manual fallback logic could be added here if needed)
      });
      
      // Manager-level errors
      newSocket.io.on("error", (error) => {
          console.error("⚠️ Socket Manager error:", error);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

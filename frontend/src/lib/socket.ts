'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');

let globalSocket: Socket | null = null;

/**
 * Hook to manage WebSocket connection
 * Shares a single socket across the app
 */
export function useSocket(token?: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    // Reuse existing connection if token matches
    if (globalSocket?.connected) {
      socketRef.current = globalSocket;
      setIsConnected(true);
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.warn('WebSocket connection error:', error.message);
      setIsConnected(false);
    });

    globalSocket = socket;
    socketRef.current = socket;

    return () => {
      // Don't disconnect on unmount — keep alive for other components
    };
  }, [token]);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (handler) {
      socketRef.current?.off(event, handler);
    } else {
      socketRef.current?.removeAllListeners(event);
    }
  }, []);

  return { socket: socketRef.current, isConnected, on, emit, off };
}

/**
 * Hook for real-time notifications
 */
export function useRealtimeNotifications(
  token?: string | null,
  onNotification?: (notification: any) => void
) {
  const { on, isConnected } = useSocket(token);

  useEffect(() => {
    if (!isConnected || !onNotification) return;

    const cleanup = on('notification:new', (notification: any) => {
      onNotification(notification);
    });

    return cleanup;
  }, [isConnected, on, onNotification]);

  return { isConnected };
}

/**
 * Disconnect the global socket (e.g., on logout)
 */
export function disconnectSocket() {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }
}

/**
 * Hook to listen for real-time events and auto-refetch data.
 * Provide an array of event names; when any fires, the onRefresh callback runs.
 */
export function useRealtimeRefresh(
  token: string | null | undefined,
  events: string[],
  onRefresh: () => void
) {
  const { on, isConnected } = useSocket(token);

  useEffect(() => {
    if (!isConnected || events.length === 0) return;

    const cleanups = events.map(event => on(event, () => {
      onRefresh();
    }));

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [isConnected, events, on, onRefresh]);

  return { isConnected };
}

import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { monitorConnectivity } from '../firebase';

export function ConnectivityMonitor() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = () => {
    if (!navigator.onLine) {
      setWsStatus('closed');
      return;
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    setWsStatus('connecting');
    
    // Determine WebSocket URL based on current origin
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws-custom`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsStatus('open');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setWsStatus('closed');
        // Exponential backoff for reconnection
        if (navigator.onLine) {
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsStatus('error');
      };

      ws.onmessage = (event) => {
        // Handle incoming messages if needed
        // console.log('WS Message:', event.data);
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setWsStatus('error');
    }
  };

  useEffect(() => {
    const cleanup = monitorConnectivity((online) => {
      setIsOnline(online);
      if (online) {
        connectWebSocket();
      } else {
        if (wsRef.current) {
          wsRef.current.close();
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      }
    });

    connectWebSocket();

    return () => {
      cleanup();
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  if (isOnline && wsStatus === 'open') return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {!isOnline && (
        <div className="flex items-center gap-2 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm animate-pulse">
          <WifiOff size={18} />
          <span className="text-sm font-medium">Você está offline</span>
        </div>
      )}
      {isOnline && wsStatus !== 'open' && (
        <div className="flex items-center gap-2 bg-amber-500/90 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm">
          <RefreshCw size={18} className="animate-spin" />
          <span className="text-sm font-medium">Reconectando ao servidor...</span>
        </div>
      )}
    </div>
  );
}

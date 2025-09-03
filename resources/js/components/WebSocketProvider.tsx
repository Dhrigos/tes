import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import webSocketService from '../services/WebSocketService';

interface WebSocketContextType {
    isConnected: boolean;
    connectionStatus: any;
    realtimeData: any;
    notificationCount: any;
    initialize: () => Promise<boolean>;
    disconnect: () => void;
    on: (eventType: string, callback: Function) => void;
    off: (eventType: string, callback: Function) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
    children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState({});
    const [realtimeData, setRealtimeData] = useState(null);
    const [notificationCount, setNotificationCount] = useState(null);

    useEffect(() => {
        // Initialize WebSocket on component mount
        initializeWebSocket();

        // Cleanup on unmount
        return () => {
            webSocketService.disconnect();
        };
    }, []);

    const initializeWebSocket = async (): Promise<boolean> => {
        try {
            const success = await webSocketService.initialize();
            if (success) {
                setIsConnected(true);

                // Get initial data
                const data = await webSocketService.getRealtimeData();
                if (data?.success) {
                    setRealtimeData(data.data);
                }

                const count = await webSocketService.getNotificationCount();
                if (count?.success) {
                    setNotificationCount(count.data);
                }

                // Listen for real-time updates
                webSocketService.on('permintaan_baru', handlePermintaanUpdate);
                webSocketService.on('permintaan_dikonfirmasi', handlePermintaanUpdate);
                webSocketService.on('barang_dikirim', handlePermintaanUpdate);
                webSocketService.on('barang_diterima', handlePermintaanUpdate);

                // Update connection status
                setConnectionStatus(webSocketService.getConnectionStatus());
            }
            return success;
        } catch (error) {
            console.error('Failed to initialize WebSocket:', error);
            return false;
        }
    };

    const handlePermintaanUpdate = async () => {
        try {
            // Refresh real-time data
            const data = await webSocketService.getRealtimeData();
            if (data?.success) {
                setRealtimeData(data.data);
            }

            // Refresh notification count
            const count = await webSocketService.getNotificationCount();
            if (count?.success) {
                setNotificationCount(count.data);
            }
        } catch (error) {
            console.error('Failed to refresh data:', error);
        }
    };

    const disconnect = () => {
        webSocketService.disconnect();
        setIsConnected(false);
        setConnectionStatus({});
    };

    const on = (eventType: string, callback: Function) => {
        webSocketService.on(eventType, callback);
    };

    const off = (eventType: string, callback: Function) => {
        webSocketService.off(eventType, callback);
    };

    const value: WebSocketContextType = {
        isConnected,
        connectionStatus,
        realtimeData,
        notificationCount,
        initialize: initializeWebSocket,
        disconnect,
        on,
        off,
    };

    return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = (): WebSocketContextType => {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};

export default WebSocketProvider;

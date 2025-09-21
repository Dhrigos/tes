class WebSocketService {
    private ws: WebSocket | null = null;
    private eventListeners: Map<string, Function[]> = new Map();
    private isInitialized = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;

    async initialize(): Promise<boolean> {
        try {
            if (this.isInitialized && this.ws?.readyState === WebSocket.OPEN) {
                return true;
            }

            // Get WebSocket URL from environment or use default
            const wsUrl = this.getWebSocketUrl();

            this.ws = new WebSocket(wsUrl);

            return new Promise((resolve) => {
                if (!this.ws) {
                    resolve(false);
                    return;
                }

                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.isInitialized = true;
                    this.reconnectAttempts = 0;
                    resolve(true);
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                };

                this.ws.onclose = (event) => {
                    console.log('WebSocket disconnected:', event.code, event.reason);
                    this.isInitialized = false;

                    // Attempt to reconnect if not a normal closure
                    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.attemptReconnect();
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    resolve(false);
                };

                // Timeout after 10 seconds
                setTimeout(() => {
                    if (!this.isInitialized) {
                        resolve(false);
                    }
                }, 10000);
            });
        } catch (error) {
            console.error('Failed to initialize WebSocket:', error);
            return false;
        }
    }

    private getWebSocketUrl(): string {
        // Try to get WebSocket URL from environment variables
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;

        // For development, use the Vite HMR WebSocket
        if (import.meta.env.DEV) {
            const hmrHost = import.meta.env.VITE_HMR_HOST || 'localhost';
            const hmrPort = import.meta.env.VITE_HMR_PORT || '5173';
            return `${protocol}//${hmrHost}:${hmrPort}`;
        }

        // For production, use the same host as the current page
        return `${protocol}//${host}`;
    }

    private handleMessage(data: any) {
        if (data.type && this.eventListeners.has(data.type)) {
            const callbacks = this.eventListeners.get(data.type) || [];
            callbacks.forEach((callback) => {
                try {
                    callback(data.payload || data);
                } catch (error) {
                    console.error('Error in WebSocket callback:', error);
                }
            });
        }
    }

    private attemptReconnect() {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.initialize();
        }, this.reconnectDelay * this.reconnectAttempts);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }
        this.isInitialized = false;
        this.eventListeners.clear();
    }

    on(eventType: string, callback: Function) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType)?.push(callback);
    }

    off(eventType: string, callback: Function) {
        const callbacks = this.eventListeners.get(eventType);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    getConnectionStatus() {
        return {
            connected: this.isInitialized && this.ws?.readyState === WebSocket.OPEN,
            readyState: this.ws?.readyState,
            reconnectAttempts: this.reconnectAttempts,
        };
    }

    async getRealtimeData() {
        try {
            const response = await fetch('/api/websocket/permintaan-barang');
            return await response.json();
        } catch (error) {
            console.error('Failed to get realtime data:', error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }

    async getNotificationCount() {
        try {
            const response = await fetch('/api/websocket/notification-count');
            return await response.json();
        } catch (error) {
            console.error('Failed to get notification count:', error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
}

const webSocketService = new WebSocketService();
export default webSocketService;

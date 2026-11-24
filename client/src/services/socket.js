import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    if (this.socket) return this.socket;

    const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:4000' : window.location.origin;
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('⚡ Connected to Board Arena Realtime Server');
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('🔌 Disconnected from Realtime Server');
    });

    return this.socket;
  }

  getSocket() {
    if (!this.socket) return this.connect();
    return this.socket;
  }

  emit(event, data, callback) {
    const s = this.getSocket();
    s.emit(event, data, callback);
  }

  on(event, handler) {
    const s = this.getSocket();
    s.on(event, handler);
    return () => s.off(event, handler);
  }
}

export const socketService = new SocketService();

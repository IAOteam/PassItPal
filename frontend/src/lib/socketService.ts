import { io, type Socket } from 'socket.io-client';

// Function to get the correct Socket.IO server URL
const getBaseUrl = (urlWithApiPath: string | undefined): string => {
  try {
    if (urlWithApiPath) {
      return new URL(urlWithApiPath).origin; // e.g. https://api.passitpal.com
    }

    // Fallbacks:
    if (typeof window !== 'undefined') {
      // In browser, if no env var: use localhost during dev
      if (window.location.hostname === 'localhost') {
        return 'http://localhost:5001';
      }
    }

    // Safe fallback if nothing is set
    return 'http://localhost:5001';
  } catch (e) {
    console.error("[SocketService] Invalid backend URL. Falling back to localhost.", e);
    return 'http://localhost:5001';
  }
};

const backendApiUrl = import.meta.env.VITE_BACKEND_URL;
;
const SOCKET_SERVER_URL = getBaseUrl(backendApiUrl);

export const socket: Socket = io(SOCKET_SERVER_URL, {
  autoConnect: false, // IMPORTANT: do not connect automatically
});

socket.on("connect_error", (err: Error & { data?: unknown }) => {
  console.error("[SocketService] Raw connect_error on instance:", err.message, err.data);
});

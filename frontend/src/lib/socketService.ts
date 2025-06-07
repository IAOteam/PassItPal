import { io, type Socket } from 'socket.io-client';

// Function to get base URL correctly
const getBaseUrl = (urlWithApiPath: string | undefined): string => {
  if (!urlWithApiPath) return 'http://localhost:5001'; // Default if undefined
  try {
    const url = new URL(urlWithApiPath);
    return `${url.protocol}//${url.host}`; // Returns http://localhost:5001
  } catch (e) {
    console.error("[SocketService] Error parsing VITE_BACKEND_URL for base socket URL, defaulting.", e);
    return 'http://localhost:5001';
  }
};

const backendApiUrl = import.meta.env.VITE_BACKEND_URL;
const SOCKET_SERVER_URL = getBaseUrl(backendApiUrl);

console.log('[SocketService] Initializing socket with URL:', SOCKET_SERVER_URL);

// Create a single socket instance, but don't connect automatically.
// We'll manage connection/disconnection and auth token via AuthContext.
export const socket: Socket = io(SOCKET_SERVER_URL, {
  autoConnect: false, // IMPORTANT: Do not connect automatically
  // We will add the auth token dynamically before calling socket.connect()
});

// You can add global listeners here if necessary, e.g., for generic errors,
// but most application-specific listeners will be in AuthContext.

socket.on("connect_error", (err: Error & { data?: unknown }) => {
    // This is a low-level connection error listener on the instance itself.
    // AuthContext will also have its own connect_error listener once connect() is called.
    console.error("[SocketService] Raw connect_error on instance:", err.message, err.data);
});

// You could also export functions to manage this socket if needed,
// but for now, just exporting the instance is fine for AuthContext to use.
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let socket: Socket | null = null;

export const initSocket = (userId: string, role?: string) => {
    if (socket) return socket;

    socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
        console.log("Connected to socket server");

        if (userId) {
            socket?.emit("join", userId);
        }

        if (role === 'admin') {
            socket?.emit("join_admin");
        }
    });

    socket.on("force_logout", (data: { sessionId: string; except?: string }) => {
        const { user, logout } = useAuthStore.getState();
        
        if (!user) return;

        const shouldLogout = 
            (data.sessionId === user.sessionId) || 
            (data.sessionId === 'others' && data.except !== user.sessionId);

        if (shouldLogout) {
            logout();
            window.location.href = "/login?reason=session_revoked";
        }
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

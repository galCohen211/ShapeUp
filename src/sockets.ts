import { io } from 'socket.io-client';

export const socket = io(process.env.SERVER_URL, {path: "/users-chat", autoConnect: false});
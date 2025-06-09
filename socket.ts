import { io } from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_API_SOCKET_URL ?? "https://socket.turbodeliveryapp.com" //'https://147.79.101.226:3009';

export const socket = io(URL);

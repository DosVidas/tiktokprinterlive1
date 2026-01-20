import { io } from 'socket.io-client';

const url = process.env.SERVER_URL || 'http://localhost:8081';
console.log(`Connecting to ${url} as test client`);
const socket = io(url);

const listenEvents = ['chat','gift','like','member','roomUser','streamEnd','statistic'];
listenEvents.forEach(e => socket.on(e, (data) => console.log(`EVENT [${e}]`, data)));

socket.on('connect', () => console.log('socket connected', socket.id));
socket.on('disconnect', () => console.log('socket disconnected'));

// Keep process alive
setInterval(() => {}, 1000);

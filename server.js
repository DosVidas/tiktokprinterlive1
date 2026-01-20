import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { TikTokConnectionWrapper, getGlobalConnectionCount } from './connectionWrapper.js';
import { WebcastEvent } from 'tiktok-live-connector';

const app = express();
// parse JSON bodies for dev emit endpoint
app.use(express.json());
const httpServer = createServer(app);

// Enable cross origin resource sharing
const io = new Server(httpServer, {
    cors: {
        origin: '*'
    }
});

io.on('connection', (socket) => {
    let tiktokConnectionWrapper;

    socket.on('setUniqueId', (uniqueId, options) => {

        // Prohibit the client from specifying these options (for security reasons)
        if (typeof options === 'object') {
            delete options.requestOptions;
            delete options.websocketOptions;
        }

        // Is the client already connected to a stream? => Disconnect
        if (tiktokConnectionWrapper) {
            tiktokConnectionWrapper.disconnect();
        }

        // Connect to the given username (uniqueId)
        try {
            tiktokConnectionWrapper = new TikTokConnectionWrapper(uniqueId, options, true);
            tiktokConnectionWrapper.connect();
        } catch (err) {
            socket.emit('disconnected', err.toString());
            return;
        }

        // Redirect wrapper control events once
        tiktokConnectionWrapper.once('connected', state => socket.emit('tiktokConnected', state));
        tiktokConnectionWrapper.once('disconnected', reason => socket.emit('tiktokDisconnected', reason));

        // Notify client when stream ends
        tiktokConnectionWrapper.connection.on(WebcastEvent.STREAM_END, () => socket.emit('streamEnd'));

        // Redirect message events using new WebcastEvent enum
        tiktokConnectionWrapper.connection.on(WebcastEvent.ROOM_USER, msg => socket.emit('roomUser', msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.MEMBER, msg => socket.emit('member', msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.CHAT, msg => socket.emit('chat', msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.GIFT, msg => socket.emit('gift', msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.SOCIAL, msg => socket.emit('social', msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.LIKE, msg => socket.emit('like', msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.QUESTION_NEW, msg => socket.emit('questionNew', msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.LINK_MIC_BATTLE, msg => socket.emit('linkMicBattle', msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.LINK_MIC_ARMIES, msg => socket.emit('linkMicArmies', msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.LIVE_INTRO, msg => socket.emit('liveIntro', msg));
    });

    socket.on('disconnect', () => {
        if (tiktokConnectionWrapper) {
            tiktokConnectionWrapper.disconnect();
        }
    });
});

// Default connection removed for proprietary version

// Emit global connection statistics
setInterval(() => {
    io.emit('statistic', { globalConnectionCount: getGlobalConnectionCount() });
}, 5000)

// Serve frontend files
app.use(express.static('public'));

// Dev-only: emit arbitrary socket.io events to connected clients
// Enabled by setting environment variable DEV_EMIT=true when starting the server.
app.post('/_dev/emit', (req, res) => {
    try {
        if (process.env.DEV_EMIT !== 'true') {
            return res.status(403).json({ error: 'dev emit disabled' });
        }
        const { event, payload } = req.body || {};
        if (!event) return res.status(400).json({ error: 'missing event' });
        io.emit(event, payload === undefined ? null : payload);
        return res.json({ ok: true, emitted: event });
    } catch (err) {
        console.error('Failed to emit event', err);
        return res.status(500).json({ error: err.toString() });
    }
});

// Start http listener
const port = process.env.PORT || 8081;
const host = '0.0.0.0'; // Bind to all interfaces for Render compatibility

httpServer.listen(port, host, () => {
    console.info(`Server running! Please visit http://localhost:${port}`);
});

// Global Error Handlers to prevent server crash
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    // Keep the server running
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
    // Keep the server running
});
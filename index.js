// index.js - Updated robust version
const express = require('express');
const axios = require('axios');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Add CORS headers for better compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Keep app awake endpoint
app.get('/', (req, res) => {
  console.log('📡 Health check request received');
  res.json({ 
    status: 'Larksuite Proxy Active',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    endpoints: {
      webhook: '/webhook',
      health: '/'
    }
  });
});

// Keep-alive ping (to prevent sleeping)
setInterval(() => {
  console.log('💓 Keep-alive ping:', new Date().toISOString());
}, 14 * 60 * 1000); // Every 14 minutes

// Main webhook endpoint
app.post('/webhook', async (req, res) => {
  const startTime = Date.now();
  console.log('\n🚀 === WEBHOOK REQUEST START ===');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('📥 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📝 Body:', JSON.stringify(req.body, null, 2));
  console.log('🔍 Body type:', typeof req.body);
  console.log('📊 Body size:', JSON.stringify(req.body).length, 'bytes');

  try {
    // Handle verification challenge
    if (req.body && req.body.type === 'url_verification') {
      console.log('✅ VERIFICATION CHALLENGE DETECTED');
      console.log('🔑 Challenge received:', req.body.challenge);
      
      const response = { challenge: req.body.challenge };
      console.log('📤 Preparing response:', JSON.stringify(response));
      
      // Set explicit headers
      res.setHeader('Content-Type', 'application/json');
      res.status(200);
      
      console.log('📨 Sending response...');
      const jsonResponse = JSON.stringify(response);
      console.log('📋 Final response string:', jsonResponse);
      
      res.end(jsonResponse);
      
      const duration = Date.now() - startTime;
      console.log('⚡ Response sent in', duration, 'ms');
      console.log('🎉 === VERIFICATION COMPLETE ===\n');
      return;
    }

    // Handle regular message events
    if (req.body && req.body.header && req.body.header.event_type) {
      console.log('📧 MESSAGE EVENT DETECTED');
      console.log('🏷️ Event type:', req.body.header.event_type);
      
      console.log('🔄 Forwarding to Make.com...');
      const makecomResponse = await axios.post(
        'https://hook.us2.make.com/ksycdm5ek8ae3rrykmplztv9zsrr6hsq', 
        req.body,
        {
          headers: { 
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );
      
      console.log('✅ Make.com response status:', makecomResponse.status);
      console.log('📋 Make.com response:', makecomResponse.data);
      
      res.status(200).json({ success: true, forwarded: true });
      console.log('🎯 === MESSAGE FORWARDED ===\n');
      return;
    }

    // Handle unknown requests
    console.log('❓ UNKNOWN REQUEST TYPE');
    console.log('🤔 Request body:', req.body);
    res.status(200).json({ 
      success: true, 
      message: 'Request received but not processed',
      received: req.body 
    });
    console.log('🏁 === UNKNOWN REQUEST HANDLED ===\n');

  } catch (error) {
    console.error('💥 === ERROR OCCURRED ===');
    console.error('❌ Error message:', error.message);
    console.error('📍 Error stack:', error.stack);
    
    // Always respond with success to avoid Larksuite retries
    res.status(200).json({ 
      success: true, 
      error: 'Internal error but acknowledged',
      timestamp: new Date().toISOString()
    });
    console.error('🆘 === ERROR HANDLED ===\n');
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Unhandled error:', error);
  res.status(200).json({ success: true, error: 'Server error' });
});

// 404 handler
app.use((req, res) => {
  console.log('🔍 404 request:', req.method, req.path);
  res.status(404).json({ 
    error: 'Endpoint not found',
    method: req.method,
    path: req.path,
    available: ['/webhook', '/']
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 === SERVER STARTED ===');
  console.log('📡 Server running on port', PORT);
  console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
  console.log('⏰ Started at:', new Date().toISOString());
  console.log('🔗 Webhook endpoint: /webhook');
  console.log('💓 Keep-alive enabled');
  console.log('🎯 Target Make.com webhook configured');
  console.log('✅ === READY TO RECEIVE REQUESTS ===\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server shut down complete');
    process.exit(0);
  });
});
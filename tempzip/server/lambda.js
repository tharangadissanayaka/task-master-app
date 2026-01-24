const serverlessExpress = require('@vendia/serverless-express');
const app = require('./index');

// Create the serverless handler
let cachedServer;

exports.handler = async (event, context) => {
  // Initialize serverless-express only once
  if (!cachedServer) {
    cachedServer = serverlessExpress({ app });
  }
  
  // Log the incoming request for debugging
  console.log('Incoming event:', JSON.stringify({
    path: event.rawPath,
    method: event.requestContext?.http?.method,
    body: event.body ? 'present' : 'absent'
  }));
  
  return cachedServer(event, context);
};


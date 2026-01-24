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
  // Log request metadata and a short body preview to debug payload parsing
  console.log('Incoming event:', JSON.stringify({
    path: event.rawPath,
    method: event.requestContext?.http?.method,
    contentType: event.headers?.['content-type'] || event.headers?.['Content-Type'],
    isBase64Encoded: event.isBase64Encoded,
    bodyPreview: event.body ? event.body.slice(0, 120) : 'absent'
  }));
  
  return cachedServer(event, context);
};


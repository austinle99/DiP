/**
 * Vercel Serverless Function entry point.
 * Wraps the Express app as a single serverless function that handles all /api/* routes.
 */
import app from '../backend/src/app.js';

export default app;

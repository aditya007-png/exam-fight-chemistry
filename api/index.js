// api/index.js
// Vercel Serverless Function entry point for Exam Fight Chemistry REST API
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const app = require('../server/server.cjs');

export default app;

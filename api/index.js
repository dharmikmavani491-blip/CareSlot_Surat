const app = require('../backend/app');
const db = require('../backend/config/database');
const seed = require('../backend/database/seed');

let isInitialized = false;

module.exports = async (req, res) => {
  if (!isInitialized) {
    try {
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
      if (userCount === 0) {
        console.log('Vercel serverless cold start: Seeding database in /tmp...');
        await seed();
      }
      isInitialized = true;
    } catch (err) {
      console.error('Initialization error on Vercel serverless start:', err);
    }
  }
  return app(req, res);
};

const app = require('./app');
const config = require('./config/config');
const db = require('./config/database');
const seed = require('./database/seed');

async function startServer() {
  try {
    // Check if initial database seeding is needed
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount === 0) {
      console.log('Database is empty. Automatically running initial seeder...');
      await seed();
    }

    const server = app.listen(config.port, () => {
      console.log('================================================================');
      console.log(' ONLINE HOSPITAL APPOINTMENT BOOKING SYSTEM - WAD PBL ACTIVITY 2');
      console.log('================================================================');
      console.log(` Web App UI & API:  http://localhost:${config.port}`);
      console.log(` Health Check:       http://localhost:${config.port}/api/health`);
      console.log(` API Docs / Explorer: http://localhost:${config.port}#docs`);
      console.log(` Database:          ${config.dbPath}`);
      console.log(` Environment:       ${config.env}`);
      console.log('================================================================');
    });

    const shutdown = () => {
      console.log('\nGracefully shutting down hospital appointment server...');
      server.close(() => {
        console.log('HTTP server closed.');
        try {
          db.close();
          console.log('Database connection closed safely.');
        } catch (e) {
          // ignore
        }
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Fatal: Server startup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = startServer;

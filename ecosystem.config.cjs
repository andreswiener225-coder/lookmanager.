/**
 * PM2 Configuration for LokoManager Development
 * 
 * Usage:
 * 1. Build first: npm run build
 * 2. Start PM2: pm2 start ecosystem.config.cjs
 * 3. Check logs: pm2 logs lokomanager --nostream
 * 4. Restart: pm2 restart lokomanager
 * 5. Stop: pm2 delete lokomanager
 */

module.exports = {
  apps: [
    {
      name: 'lokomanager',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=lokomanager-production --local --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false, // Disable PM2 file watching (wrangler has hot reload)
      instances: 1, // Development mode: single instance
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      error_file: 'logs/lokomanager-error.log',
      out_file: 'logs/lokomanager-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};

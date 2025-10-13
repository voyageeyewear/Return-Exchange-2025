# Deployment Guide

## Deploying to Production

### Pre-Deployment Checklist

- [ ] Change default admin password
- [ ] Update JWT_SECRET to a strong, random value
- [ ] Configure email credentials
- [ ] Set NODE_ENV to 'production'
- [ ] Review and update CORS settings
- [ ] Set up SSL certificate
- [ ] Configure database backups
- [ ] Test all features in staging environment

### Environment Variables for Production

Create a `.env` file with production values:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your_very_strong_random_secret_key_here

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_production_email@domain.com
EMAIL_PASSWORD=your_app_password

# Admin Credentials
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=strong_password_here
```

## Deployment Options

### Option 1: Deploy to Heroku

#### Backend (API Server)

1. Install Heroku CLI
2. Create a new Heroku app:
```bash
heroku create your-app-name-api
```

3. Set environment variables:
```bash
heroku config:set JWT_SECRET=your_secret
heroku config:set ADMIN_EMAIL=admin@yourdomain.com
heroku config:set ADMIN_PASSWORD=your_password
# Add other variables...
```

4. Create a `Procfile`:
```
web: node backend/server.js
```

5. Deploy:
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

#### Frontend

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Deploy to Netlify, Vercel, or similar:
   - Connect your GitHub repo
   - Set build command: `cd frontend && npm run build`
   - Set publish directory: `frontend/build`
   - Set environment variable: `REACT_APP_API_URL=https://your-app-name-api.herokuapp.com`

### Option 2: Deploy to VPS (DigitalOcean, AWS, etc.)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Upload Your Code

```bash
# Clone your repository
git clone your-repo-url
cd return-exchange

# Install dependencies
npm install
cd frontend
npm install
cd ..
```

#### 3. Build Frontend

```bash
cd frontend
npm run build
cd ..
```

#### 4. Configure Nginx

Create `/etc/nginx/sites-available/return-exchange`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/return-exchange/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads {
        alias /path/to/return-exchange/uploads;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/return-exchange /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Start Backend with PM2

```bash
pm2 start backend/server.js --name return-exchange-api
pm2 save
pm2 startup
```

#### 6. Set Up SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 3: Deploy to Docker

#### Create `Dockerfile` for Backend

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY backend ./backend
COPY public ./public

EXPOSE 5000

CMD ["node", "backend/server.js"]
```

#### Create `Dockerfile` for Frontend

```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend ./
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Create `docker-compose.yml`

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - JWT_SECRET=${JWT_SECRET}
      - EMAIL_HOST=${EMAIL_HOST}
      - EMAIL_PORT=${EMAIL_PORT}
      - EMAIL_USER=${EMAIL_USER}
      - EMAIL_PASSWORD=${EMAIL_PASSWORD}
      - ADMIN_EMAIL=${ADMIN_EMAIL}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
    volumes:
      - ./uploads:/app/uploads
      - ./database.db:/app/database.db

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

Deploy:
```bash
docker-compose up -d
```

## Post-Deployment Tasks

### 1. Database Backup

Set up regular backups of `database.db`:

```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp database.db backups/database_$DATE.db
# Keep only last 30 backups
ls -t backups/database_*.db | tail -n +31 | xargs rm -f
```

Add to crontab for daily backups:
```bash
0 2 * * * /path/to/backup-script.sh
```

### 2. Monitoring

Set up monitoring with PM2:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 3. Security Headers

Add to Nginx configuration:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

### 4. Rate Limiting

Install and configure rate limiting:

```bash
npm install express-rate-limit
```

Add to `backend/server.js`:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Scaling Considerations

### Database

For high traffic, consider migrating from SQLite to PostgreSQL or MySQL:

1. Install database driver: `npm install pg` or `npm install mysql2`
2. Update database connection in `backend/database.js`
3. Migrate data from SQLite to new database

### File Storage

For production, consider using cloud storage for uploads:

1. AWS S3
2. Google Cloud Storage
3. Cloudinary

Update multer configuration to use cloud storage.

### Load Balancing

For high availability, set up multiple backend instances behind a load balancer:

```bash
# Start multiple instances with PM2
pm2 start backend/server.js -i max --name return-exchange-api
```

## Monitoring & Maintenance

### Log Management

```bash
# View logs
pm2 logs return-exchange-api

# Clear logs
pm2 flush
```

### Health Checks

Set up a health check endpoint monitoring:

```bash
curl http://your-domain.com/api/health
```

Use services like:
- UptimeRobot
- Pingdom
- StatusCake

### Performance Monitoring

Consider integrating:
- New Relic
- DataDog
- Application Insights

## Troubleshooting Production Issues

### High CPU Usage
- Check logs for errors
- Review database queries
- Implement caching (Redis)

### Memory Leaks
- Monitor with `pm2 monit`
- Update Node.js to latest LTS
- Review code for circular references

### Database Locks
- Implement connection pooling
- Add proper indexes
- Consider migration to PostgreSQL

## Backup & Recovery

### Database Backup

```bash
# Manual backup
cp database.db backups/database_$(date +%Y%m%d).db

# Restore from backup
cp backups/database_20251013.db database.db
pm2 restart return-exchange-api
```

### Full System Backup

```bash
# Backup entire application
tar -czf backup_$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  /path/to/return-exchange/
```

## Security Best Practices

1. **Regular Updates**: Keep dependencies updated
   ```bash
   npm audit
   npm audit fix
   ```

2. **Firewall**: Configure UFW
   ```bash
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw allow 22
   sudo ufw enable
   ```

3. **Fail2Ban**: Protect against brute force
   ```bash
   sudo apt install fail2ban
   ```

4. **Database Security**: Regular backups and encryption
5. **SSL/TLS**: Always use HTTPS in production
6. **Environment Variables**: Never commit secrets to Git
7. **Access Control**: Limit admin access by IP if possible

---

**For additional support, consult the main README.md**


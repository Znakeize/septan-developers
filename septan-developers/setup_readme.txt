# Septan Developers - Complete Website & Admin System

A comprehensive Node.js-based CMS for managing construction and architecture projects, blog posts, services, and contact submissions.

## 📋 Table of Contents
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Admin Panel](#admin-panel)
- [API Documentation](#api-documentation)
- [File Structure](#file-structure)
- [Deployment](#deployment)

## ✨ Features

### Backend Features
- **User Management**: Multi-level admin authentication (Super Admin, Admin, Editor, Viewer)
- **Project Management**: Full CRUD operations for construction projects
- **Blog Management**: Create and manage blog posts with rich content
- **Service Management**: Manage service offerings
- **Contact Form**: Form submissions with status tracking
- **Media Library**: File upload and management system
- **Analytics**: Track page views, project views, and user activity
- **Activity Logs**: Comprehensive logging of all admin actions
- **Settings Management**: Configurable site settings

### Frontend Features
- Responsive design for all devices
- Service detail pages
- Project portfolio with filters
- Blog with detailed articles
- Contact form with validation
- Analytics tracking

### Admin Dashboard Features
- Intuitive dashboard with statistics
- Projects management (Create, Read, Update, Delete)
- Blog post management with draft/published status
- Contact submission viewer
- Media library
- User management (Super Admin only)
- Activity logs
- Site settings

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **Express Validator** - Input validation

### Frontend
- **HTML5/CSS3** - Markup and styling
- **JavaScript (Vanilla)** - Client-side functionality
- **Font Awesome** - Icons

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd septan-developers
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Create Required Directories
```bash
mkdir uploads
```

## ⚙️ Configuration

### Step 1: Create Environment File
Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

### Step 2: Configure Environment Variables
Edit the `.env` file with your settings:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=septan_developers

# JWT Secret (CHANGE THIS!)
JWT_SECRET=your_very_long_random_secret_key_here_minimum_32_characters

# Frontend URL
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@septandevelopers.com
```

## 🗄️ Database Setup

### Step 1: Create Database
Log into MySQL and run:

```sql
CREATE DATABASE septan_developers;
USE septan_developers;
```

### Step 2: Run Database Schema
Execute the SQL file `database-schema.sql`:

```bash
mysql -u root -p septan_developers < database-schema.sql
```

Or copy the SQL content from the "Database Schema" artifact and execute it in your MySQL client.

### Step 3: Verify Installation
Check that all tables are created:

```sql
SHOW TABLES;
```

You should see:
- admin_users
- services
- projects
- project_timeline
- blog_posts
- contact_submissions
- testimonials
- site_settings
- analytics
- activity_logs
- media_library

### Step 4: Default Admin Account
The schema creates a default super admin account:
- **Username**: admin
- **Email**: admin@septandevelopers.com
- **Password**: Admin@123

⚠️ **IMPORTANT**: Change this password immediately after first login!

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## 👨‍💼 Admin Panel

### Accessing the Admin Panel
1. Open your browser and navigate to: `http://localhost:5000/admin-dashboard.html`
2. Login with the default credentials (see Database Setup)
3. Change your password in Settings

### Admin Roles & Permissions

#### Super Admin
- Full access to all features
- Can manage admin users
- Can change system settings
- Can delete any content

#### Admin
- Can create, edit, and delete projects and blog posts
- Can manage services and testimonials
- Can view contact submissions
- Cannot manage users or system settings

#### Editor
- Can create and edit projects and blog posts
- Can upload media
- Cannot delete content
- Cannot access settings

#### Viewer
- Read-only access
- Can view all content
- Cannot make any changes

## 📡 API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Login to admin panel
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

#### GET /api/auth/me
Get current user information (requires token)

### Project Endpoints

#### GET /api/projects
Get all published projects (public)
Query params: `category`, `featured`, `limit`, `offset`

#### GET /api/projects/:slug
Get project by slug (public)

#### POST /api/admin/projects
Create/Update project (requires authentication)

#### DELETE /api/admin/projects/:id
Delete project (requires authentication)

### Blog Endpoints

#### GET /api/blog
Get all published blog posts (public)
Query params: `category`, `featured`, `limit`, `offset`

#### GET /api/blog/:slug
Get blog post by slug (public)

#### POST /api/admin/blog
Create/Update blog post (requires authentication)

#### DELETE /api/admin/blog/:id
Delete blog post (requires authentication)

### Service Endpoints

#### GET /api/services
Get all active services (public)

#### GET /api/services/:slug
Get service by slug (public)

#### POST /api/admin/services
Create/Update service (requires authentication)

### Contact Endpoints

#### POST /api/contact
Submit contact form (public)
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+94 77 1234567",
  "message": "I'm interested in your services"
}
```

#### GET /api/admin/contacts
Get all contact submissions (requires authentication)

#### PUT /api/admin/contacts/:id
Update contact status (requires authentication)

### Media Endpoints

#### POST /api/admin/media/upload
Upload file (requires authentication, multipart/form-data)

#### GET /api/admin/media
Get all media files (requires authentication)

### Analytics Endpoints

#### POST /api/analytics/track
Track page view or event (public)

#### GET /api/admin/analytics/dashboard
Get dashboard statistics (requires authentication)

### All authenticated endpoints require Bearer token:
```
Authorization: Bearer <your_jwt_token>
```

## 📁 File Structure

```
septan-developers/
├── server.js                    # Main server file
├── package.json                 # Dependencies
├── .env                         # Environment variables (create this)
├── .env.example                 # Environment template
├── database-schema.sql          # Database schema
├── README.md                    # This file
├── uploads/                     # Uploaded files directory
├── public/                      # Static files
│   ├── index.html              # Main homepage (your original)
│   ├── admin-dashboard.html    # Admin panel
│   ├── service-detail.html     # Service page template
│   ├── project-detail.html     # Project page template
│   └── blog-detail.html        # Blog post template
└── routes/                      # API routes (optional organization)
```

## 🔐 Security Best Practices

1. **Change Default Credentials**: Immediately change the default admin password
2. **Strong JWT Secret**: Use a long, random string for JWT_SECRET
3. **Environment Variables**: Never commit `.env` file to version control
4. **HTTPS**: Always use HTTPS in production
5. **Rate Limiting**: Built-in rate limiting protects against brute force attacks
6. **Input Validation**: All inputs are validated and sanitized
7. **SQL Injection Protection**: Using parameterized queries
8. **XSS Protection**: Helmet.js provides security headers

## 🌐 Deployment

### Deploying to Production

#### 1. Prepare Your Server
- Ubuntu 20.04+ or similar Linux server
- Node.js installed
- MySQL installed
- Nginx (optional, for reverse proxy)

#### 2. Clone and Install
```bash
git clone <repository-url>
cd septan-developers
npm install --production
```

#### 3. Configure Environment
```bash
nano .env
```
Set `NODE_ENV=production` and configure all production settings.

#### 4. Setup Database
```bash
mysql -u root -p < database-schema.sql
```

#### 5. Setup PM2 (Process Manager)
```bash
npm install -g pm2
pm2 start server.js --name septan-api
pm2 startup
pm2 save
```

#### 6. Setup Nginx (Optional)
Create Nginx config:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /path/to/septan-developers/uploads;
        expires 30d;
    }
}
```

#### 7. SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Deployment Checklist
- [ ] Environment variables configured for production
- [ ] Database backed up
- [ ] Default admin password changed
- [ ] JWT_SECRET is strong and unique
- [ ] HTTPS/SSL certificate installed
- [ ] Firewall configured
- [ ] PM2 running and configured to restart on reboot
- [ ] Nginx reverse proxy configured (if using)
- [ ] File upload directory has correct permissions
- [ ] Log rotation configured
- [ ] Monitoring setup (optional)

## 🔄 Database Backup

### Manual Backup
```bash
mysqldump -u root -p septan_developers > backup_$(date +%Y%m%d).sql
```

### Automated Daily Backup (Cron)
```bash
crontab -e
```
Add:
```
0 2 * * * mysqldump -u root -pYOUR_PASSWORD septan_developers > /backups/septan_$(date +\%Y\%m\%d).sql
```

## 📝 Creating Pages from Templates

### Service Pages
1. Copy `service-detail.html` for each service
2. Name files: `architectural-design.html`, `structural-design.html`, etc.
3. Update the JavaScript `serviceSlug` variable or pass as query parameter

### Project Pages
1. Copy `project-detail.html` for each project
2. Add project data to the `projectData` object
3. Access via: `project-detail.html?project=project-slug`

### Blog Pages
1. Copy `blog-detail.html` for each post
2. Add blog content to the `blogData` object
3. Access via: `blog-detail.html?post=post-slug`

## 🐛 Troubleshooting

### Cannot connect to database
- Check MySQL is running: `sudo systemctl status mysql`
- Verify credentials in `.env` file
- Check database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### File upload not working
- Check `uploads` directory exists and has write permissions
- Verify `MAX_FILE_SIZE` in `.env`
- Check disk space: `df -h`

### Admin login fails
- Verify default credentials haven't been changed in database
- Check JWT_SECRET is set in `.env`
- Clear browser cache and cookies

### Port already in use
- Change PORT in `.env` file
- Or stop the process using the port:
```bash
lsof -ti:5000 | xargs kill -9
```

## 📊 Monitoring & Logs

### View PM2 Logs
```bash
pm2 logs septan-api
```

### View Error Logs Only
```bash
pm2 logs septan-api --err
```

### Monitor Resources
```bash
pm2 monit
```

## 🔄 Updates & Maintenance

### Updating Dependencies
```bash
npm update
npm audit fix
```

### Database Migrations
When schema changes, create migration scripts in `migrations/` folder:
```sql
-- migrations/001_add_new_field.sql
ALTER TABLE projects ADD COLUMN new_field VARCHAR(255);
```

## 📞 Support & Contact

For technical support or questions:
- Email: septandevelopers@gmail.com
- Phone: +94 76 3132675

## 📄 License

Copyright © 2025 Septan Developers (Pvt) Ltd. All rights reserved.

## 🙏 Acknowledgments

- Font Awesome for icons
- Express.js community
- MySQL team
- All open-source contributors

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Create database
mysql -u root -p < database-schema.sql

# Configure environment
cp .env.example .env
nano .env

# Start development server
npm run dev

# Access admin panel
open http://localhost:5000/admin-dashboard.html
```

**Default Login:**
- Username: `admin`
- Password: `Admin@123`

⚠️ **Remember to change the default password immediately!**

---

## Additional Resources

### API Testing with cURL

#### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'
```

#### Test Protected Endpoint
```bash
curl -X GET http://localhost:5000/api/admin/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Test Contact Form
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+94 77 1234567",
    "message": "This is a test message"
  }'
```

### Database Queries for Common Tasks

#### Reset Admin Password
```sql
UPDATE admin_users 
SET password_hash = '$2b$10$rBV2cKl3KwOe5qV5m5pLyO7HYX6qF5vXW5xK5pLyO7HYX6qF5vXW5'
WHERE username = 'admin';
-- Password reset to: Admin@123
```

#### View All Projects
```sql
SELECT id, title, category, status, created_at 
FROM projects 
ORDER BY created_at DESC;
```

#### View Contact Submissions
```sql
SELECT id, name, email, status, created_at 
FROM contact_submissions 
WHERE status = 'new' 
ORDER BY created_at DESC;
```

#### View Activity Logs
```sql
SELECT al.*, au.username 
FROM activity_logs al
LEFT JOIN admin_users au ON al.user_id = au.id
ORDER BY al.created_at DESC
LIMIT 50;
```

### Performance Optimization Tips

1. **Database Indexing**: Already included in schema for common queries
2. **Image Optimization**: Use image compression before upload
3. **Caching**: Consider implementing Redis for frequently accessed data
4. **CDN**: Use a CDN for static assets in production
5. **Gzip Compression**: Enable in Nginx/Apache for text files
6. **Database Connection Pooling**: Already configured in server.js

### Backup Strategy

Recommended backup approach:
1. **Daily**: Full database backup
2. **Weekly**: Full system backup including uploads directory
3. **Monthly**: Archive old backups
4. **Before Updates**: Always backup before major updates

```bash
#!/bin/bash
# backup.sh - Complete backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Database backup
mysqldump -u root -p$DB_PASSWORD septan_developers > $BACKUP_DIR/db_$DATE.sql

# Files backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz uploads/

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

---

**Need Help?** Check the troubleshooting section or contact support at septandevelopers@gmail.com
-- Septan Developers Database Schema
-- MySQL Database Setup

CREATE DATABASE IF NOT EXISTS septan_developers;
USE septan_developers;

-- Admin Users Table
CREATE TABLE admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('super_admin', 'admin', 'editor', 'viewer') DEFAULT 'editor',
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Services Table
CREATE TABLE services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    short_description TEXT,
    full_description LONGTEXT,
    icon_svg LONGTEXT,
    featured_image VARCHAR(255),
    gallery JSON,
    meta_title VARCHAR(200),
    meta_description TEXT,
    meta_keywords TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_display_order (display_order)
);

-- Projects Table
CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    category ENUM('residential', 'commercial', 'renovation', 'industrial', 'landscape') NOT NULL,
    location VARCHAR(200),
    year INT,
    client_name VARCHAR(200),
    project_type VARCHAR(100),
    budget_range VARCHAR(50),
    area_sqft INT,
    duration_months INT,
    short_description TEXT,
    full_description LONGTEXT,
    featured_image VARCHAR(255),
    gallery JSON,
    services_used JSON,
    tags JSON,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    featured BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    meta_title VARCHAR(200),
    meta_description TEXT,
    meta_keywords TEXT,
    published_at DATETIME,
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_published_at (published_at),
    INDEX idx_featured (featured)
);

-- Project Timeline Table
CREATE TABLE project_timeline (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    phase_name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    completion_percentage INT DEFAULT 0,
    display_order INT DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id)
);

-- Blog Posts Table
CREATE TABLE blog_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    category VARCHAR(100),
    excerpt TEXT,
    content LONGTEXT,
    featured_image VARCHAR(255),
    gallery JSON,
    author_id INT,
    author_name VARCHAR(100),
    tags JSON,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    featured BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    read_time_minutes INT,
    meta_title VARCHAR(200),
    meta_description TEXT,
    meta_keywords TEXT,
    published_at DATETIME,
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES admin_users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_published_at (published_at),
    INDEX idx_featured (featured),
    FULLTEXT idx_search (title, excerpt, content)
);

-- Contact Form Submissions Table
CREATE TABLE contact_submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    message TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status ENUM('new', 'read', 'replied', 'archived') DEFAULT 'new',
    assigned_to INT,
    notes TEXT,
    replied_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES admin_users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_email (email)
);

-- Testimonials Table
CREATE TABLE testimonials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_name VARCHAR(100) NOT NULL,
    client_position VARCHAR(100),
    client_company VARCHAR(100),
    client_location VARCHAR(100),
    rating INT DEFAULT 5,
    testimonial_text TEXT NOT NULL,
    client_image VARCHAR(255),
    project_id INT,
    display_order INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    INDEX idx_display_order (display_order),
    INDEX idx_is_featured (is_featured)
);

-- Site Settings Table
CREATE TABLE site_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value LONGTEXT,
    setting_type ENUM('text', 'number', 'boolean', 'json', 'image') DEFAULT 'text',
    category VARCHAR(50),
    description TEXT,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    INDEX idx_category (category)
);

-- Analytics Table
CREATE TABLE analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_type ENUM('page_view', 'project_view', 'blog_view', 'contact_form', 'download') NOT NULL,
    page_url VARCHAR(255),
    reference_id INT,
    reference_type VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer VARCHAR(255),
    country VARCHAR(100),
    city VARCHAR(100),
    device_type ENUM('mobile', 'tablet', 'desktop', 'unknown') DEFAULT 'unknown',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at),
    INDEX idx_reference (reference_type, reference_id)
);

-- Activity Logs Table
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_entity (entity_type, entity_id)
);

-- Media Library Table
CREATE TABLE media_library (
    id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    mime_type VARCHAR(100),
    file_size INT,
    width INT,
    height INT,
    alt_text VARCHAR(255),
    caption TEXT,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    INDEX idx_file_type (file_type),
    INDEX idx_created_at (created_at)
);

-- Insert Default Super Admin (password: Admin@123)
-- NOTE: Change this password immediately after first login
INSERT INTO admin_users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@septandevelopers.com', '$2b$10$rBV2cKl3KwOe5qV5m5pLyO7HYX6qF5vXW5xK5pLyO7HYX6qF5vXW5', 'System Administrator', 'super_admin');

-- Insert Default Site Settings
INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description) VALUES
('site_name', 'Septan Developers', 'text', 'general', 'Website name'),
('site_tagline', 'Build Your Vision', 'text', 'general', 'Website tagline'),
('contact_email', 'septandevelopers@gmail.com', 'text', 'contact', 'Main contact email'),
('contact_phone', '+94 76 3132675', 'text', 'contact', 'Main contact phone'),
('contact_address', 'Ambalangoda, Sri Lanka', 'text', 'contact', 'Office address'),
('facebook_url', 'https://facebook.com/SeptanDevelopers', 'text', 'social', 'Facebook page URL'),
('instagram_url', 'https://instagram.com/septan_developers', 'text', 'social', 'Instagram profile URL'),
('linkedin_url', 'https://linkedin.com/company/septan-developers-pvt-ltd', 'text', 'social', 'LinkedIn company URL'),
('youtube_url', 'https://youtube.com/@SeptanDevelopers', 'text', 'social', 'YouTube channel URL'),
('tiktok_url', 'https://tiktok.com/@septandevelopers', 'text', 'social', 'TikTok profile URL'),
('analytics_enabled', 'true', 'boolean', 'analytics', 'Enable analytics tracking'),
('maintenance_mode', 'false', 'boolean', 'general', 'Enable maintenance mode');

-- Insert Sample Services
INSERT INTO services (title, slug, short_description, display_order, is_active) VALUES
('Architectural Design', 'architectural-design', 'Striking facades integrating stone, wood, and metal with nature. We create innovative designs that blend modern aesthetics with environmental harmony.', 1, TRUE),
('Structural Design', 'structural-design', 'Robust engineering for durable, safe structures. Our structural solutions ensure longevity and safety while maintaining design integrity.', 2, TRUE),
('Building Information Modeling (BIM)', 'building-information-modeling', 'Comprehensive 3D modeling for seamless project visualization, coordination, and efficient construction from concept to completion.', 3, TRUE),
('Interior Design', 'interior-design', 'Functional and aesthetic indoor spaces. We transform interiors into inspiring environments that reflect your vision and lifestyle.', 4, TRUE),
('3D Rendering & Visualization', '3d-rendering-visualization', 'High-quality 3D models and virtual tours for design previews. Experience your project before construction begins.', 5, TRUE),
('Estimation & Consultation', 'estimation-consultation', 'Accurate cost estimates and expert consultation services. We provide transparent pricing and professional guidance throughout your project.', 6, TRUE),
('Project Management', 'project-management', 'Efficient oversight from planning to completion. We ensure your project stays on schedule and within budget.', 7, TRUE);

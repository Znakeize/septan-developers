// Complete Backend Server with all API routes
// Continue from previous server.js

// ==================== PROJECTS ROUTES ====================

// Get all projects (public)
app.get('/api/projects', async (req, res) => {
    const { category, status, featured, limit = 100, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM projects WHERE 1=1';
    const params = [];

    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    } else {
        query += ' AND status = "published"';
    }

    if (featured) {
        query += ' AND featured = ?';
        params.push(featured === 'true' ? 1 : 0);
    }

    query += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    try {
        const [projects] = await pool.query(query, params);
        
        // Parse JSON fields
        projects.forEach(p => {
            p.gallery = p.gallery ? JSON.parse(p.gallery) : [];
            p.services_used = p.services_used ? JSON.parse(p.services_used) : [];
            p.tags = p.tags ? JSON.parse(p.tags) : [];
        });

        res.json({ projects });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get project by slug (public)
app.get('/api/projects/:slug', async (req, res) => {
    const { slug } = req.params;
    
    try {
        const [projects] = await pool.query(
            'SELECT * FROM projects WHERE slug = ? AND status = "published"',
            [slug]
        );

        if (projects.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const project = projects[0];
        project.gallery = project.gallery ? JSON.parse(project.gallery) : [];
        project.services_used = project.services_used ? JSON.parse(project.services_used) : [];
        project.tags = project.tags ? JSON.parse(project.tags) : [];

        // Increment view count
        await pool.query('UPDATE projects SET views_count = views_count + 1 WHERE id = ?', [project.id]);

        // Get project timeline
        const [timeline] = await pool.query(
            'SELECT * FROM project_timeline WHERE project_id = ? ORDER BY display_order ASC',
            [project.id]
        );

        project.timeline = timeline;

        res.json({ project });
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create/Update project (Admin)
app.post('/api/admin/projects', authenticateToken, checkPermission(['super_admin', 'admin', 'editor']), async (req, res) => {
    const {
        id, title, slug, category, location, year, client_name, project_type,
        budget_range, area_sqft, duration_months, short_description, full_description,
        featured_image, gallery, services_used, tags, status, featured,
        meta_title, meta_description, meta_keywords
    } = req.body;

    try {
        if (id) {
            // Update
            await pool.query(
                `UPDATE projects SET title = ?, slug = ?, category = ?, location = ?, year = ?,
                client_name = ?, project_type = ?, budget_range = ?, area_sqft = ?, duration_months = ?,
                short_description = ?, full_description = ?, featured_image = ?, gallery = ?,
                services_used = ?, tags = ?, status = ?, featured = ?,
                meta_title = ?, meta_description = ?, meta_keywords = ?,
                published_at = IF(status = 'published' AND published_at IS NULL, NOW(), published_at),
                updated_by = ? WHERE id = ?`,
                [title, slug, category, location, year, client_name, project_type, budget_range,
                 area_sqft, duration_months, short_description, full_description, featured_image,
                 JSON.stringify(gallery), JSON.stringify(services_used), JSON.stringify(tags),
                 status, featured, meta_title, meta_description, meta_keywords, req.user.id, id]
            );

            await logActivity(req.user.id, 'update', 'project', id, `Updated project: ${title}`, req.ip, req.get('user-agent'));
            res.json({ message: 'Project updated successfully', projectId: id });
        } else {
            // Create
            const [result] = await pool.query(
                `INSERT INTO projects (title, slug, category, location, year, client_name,
                project_type, budget_range, area_sqft, duration_months, short_description,
                full_description, featured_image, gallery, services_used, tags, status, featured,
                meta_title, meta_description, meta_keywords, published_at, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                IF(? = 'published', NOW(), NULL), ?)`,
                [title, slug, category, location, year, client_name, project_type, budget_range,
                 area_sqft, duration_months, short_description, full_description, featured_image,
                 JSON.stringify(gallery), JSON.stringify(services_used), JSON.stringify(tags),
                 status, featured, meta_title, meta_description, meta_keywords, status, req.user.id]
            );

            await logActivity(req.user.id, 'create', 'project', result.insertId, `Created project: ${title}`, req.ip, req.get('user-agent'));
            res.status(201).json({ message: 'Project created successfully', projectId: result.insertId });
        }
    } catch (error) {
        console.error('Error saving project:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete project (Admin)
app.delete('/api/admin/projects/:id', authenticateToken, checkPermission(['super_admin', 'admin']), async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM projects WHERE id = ?', [id]);
        await logActivity(req.user.id, 'delete', 'project', id, `Deleted project #${id}`, req.ip, req.get('user-agent'));
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== BLOG ROUTES ====================

// Get all blog posts (public)
app.get('/api/blog', async (req, res) => {
    const { category, status, featured, limit = 20, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM blog_posts WHERE 1=1';
    const params = [];

    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    } else {
        query += ' AND status = "published"';
    }

    if (featured) {
        query += ' AND featured = ?';
        params.push(featured === 'true' ? 1 : 0);
    }

    query += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    try {
        const [posts] = await pool.query(query, params);
        
        posts.forEach(p => {
            p.gallery = p.gallery ? JSON.parse(p.gallery) : [];
            p.tags = p.tags ? JSON.parse(p.tags) : [];
        });

        res.json({ posts });
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get blog post by slug (public)
app.get('/api/blog/:slug', async (req, res) => {
    const { slug } = req.params;
    
    try {
        const [posts] = await pool.query(
            'SELECT * FROM blog_posts WHERE slug = ? AND status = "published"',
            [slug]
        );

        if (posts.length === 0) {
            return res.status(404).json({ error: 'Blog post not found' });
        }

        const post = posts[0];
        post.gallery = post.gallery ? JSON.parse(post.gallery) : [];
        post.tags = post.tags ? JSON.parse(post.tags) : [];

        // Increment view count
        await pool.query('UPDATE blog_posts SET views_count = views_count + 1 WHERE id = ?', [post.id]);

        res.json({ post });
    } catch (error) {
        console.error('Error fetching blog post:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create/Update blog post (Admin)
app.post('/api/admin/blog', authenticateToken, checkPermission(['super_admin', 'admin', 'editor']), async (req, res) => {
    const {
        id, title, slug, category, excerpt, content, featured_image, gallery,
        author_name, tags, status, featured, read_time_minutes,
        meta_title, meta_description, meta_keywords
    } = req.body;

    try {
        if (id) {
            // Update
            await pool.query(
                `UPDATE blog_posts SET title = ?, slug = ?, category = ?, excerpt = ?,
                content = ?, featured_image = ?, gallery = ?, author_name = ?, tags = ?,
                status = ?, featured = ?, read_time_minutes = ?,
                meta_title = ?, meta_description = ?, meta_keywords = ?,
                published_at = IF(status = 'published' AND published_at IS NULL, NOW(), published_at),
                updated_by = ? WHERE id = ?`,
                [title, slug, category, excerpt, content, featured_image, JSON.stringify(gallery),
                 author_name, JSON.stringify(tags), status, featured, read_time_minutes,
                 meta_title, meta_description, meta_keywords, req.user.id, id]
            );

            await logActivity(req.user.id, 'update', 'blog_post', id, `Updated blog post: ${title}`, req.ip, req.get('user-agent'));
            res.json({ message: 'Blog post updated successfully', postId: id });
        } else {
            // Create
            const [result] = await pool.query(
                `INSERT INTO blog_posts (title, slug, category, excerpt, content, featured_image,
                gallery, author_id, author_name, tags, status, featured, read_time_minutes,
                meta_title, meta_description, meta_keywords, published_at, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                IF(? = 'published', NOW(), NULL), ?)`,
                [title, slug, category, excerpt, content, featured_image, JSON.stringify(gallery),
                 req.user.id, author_name, JSON.stringify(tags), status, featured, read_time_minutes,
                 meta_title, meta_description, meta_keywords, status, req.user.id]
            );

            await logActivity(req.user.id, 'create', 'blog_post', result.insertId, `Created blog post: ${title}`, req.ip, req.get('user-agent'));
            res.status(201).json({ message: 'Blog post created successfully', postId: result.insertId });
        }
    } catch (error) {
        console.error('Error saving blog post:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete blog post (Admin)
app.delete('/api/admin/blog/:id', authenticateToken, checkPermission(['super_admin', 'admin']), async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM blog_posts WHERE id = ?', [id]);
        await logActivity(req.user.id, 'delete', 'blog_post', id, `Deleted blog post #${id}`, req.ip, req.get('user-agent'));
        res.json({ message: 'Blog post deleted successfully' });
    } catch (error) {
        console.error('Error deleting blog post:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== CONTACT SUBMISSIONS ROUTES ====================

// Submit contact form (public)
app.post('/api/contact', [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('phone').optional().trim(),
    body('message').notEmpty().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, message } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    try {
        const [result] = await pool.query(
            'INSERT INTO contact_submissions (name, email, phone, message, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, phone, message, ipAddress, userAgent]
        );

        // Track analytics
        await pool.query(
            'INSERT INTO analytics (event_type, reference_id, reference_type, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
            ['contact_form', result.insertId, 'contact', ipAddress, userAgent]
        );

        res.status(201).json({ message: 'Contact form submitted successfully' });
    } catch (error) {
        console.error('Error submitting contact form:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all contact submissions (Admin)
app.get('/api/admin/contacts', authenticateToken, async (req, res) => {
    const { status, limit = 100, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM contact_submissions WHERE 1=1';
    const params = [];

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    try {
        const [contacts] = await pool.query(query, params);
        res.json({ contacts });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update contact status (Admin)
app.put('/api/admin/contacts/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status, notes, assigned_to } = req.body;

    try {
        await pool.query(
            'UPDATE contact_submissions SET status = ?, notes = ?, assigned_to = ?, replied_at = IF(status = "replied", NOW(), replied_at) WHERE id = ?',
            [status, notes, assigned_to, id]
        );

        await logActivity(req.user.id, 'update', 'contact', id, `Updated contact submission #${id}`, req.ip, req.get('user-agent'));
        res.json({ message: 'Contact updated successfully' });
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== TESTIMONIALS ROUTES ====================

// Get all testimonials (public)
app.get('/api/testimonials', async (req, res) => {
    try {
        const [testimonials] = await pool.query(
            'SELECT * FROM testimonials WHERE is_active = TRUE ORDER BY display_order ASC, created_at DESC'
        );
        res.json({ testimonials });
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create/Update testimonial (Admin)
app.post('/api/admin/testimonials', authenticateToken, checkPermission(['super_admin', 'admin', 'editor']), async (req, res) => {
    const {
        id, client_name, client_position, client_company, client_location,
        rating, testimonial_text, client_image, project_id, display_order, is_featured, is_active
    } = req.body;

    try {
        if (id) {
            await pool.query(
                `UPDATE testimonials SET client_name = ?, client_position = ?, client_company = ?,
                client_location = ?, rating = ?, testimonial_text = ?, client_image = ?,
                project_id = ?, display_order = ?, is_featured = ?, is_active = ? WHERE id = ?`,
                [client_name, client_position, client_company, client_location, rating,
                 testimonial_text, client_image, project_id, display_order, is_featured, is_active, id]
            );
            res.json({ message: 'Testimonial updated successfully' });
        } else {
            const [result] = await pool.query(
                `INSERT INTO testimonials (client_name, client_position, client_company, client_location,
                rating, testimonial_text, client_image, project_id, display_order, is_featured, is_active, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [client_name, client_position, client_company, client_location, rating,
                 testimonial_text, client_image, project_id, display_order, is_featured, is_active, req.user.id]
            );
            res.status(201).json({ message: 'Testimonial created successfully', testimonialId: result.insertId });
        }
    } catch (error) {
        console.error('Error saving testimonial:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== MEDIA LIBRARY ROUTES ====================

// Upload file
app.post('/api/admin/media/upload', authenticateToken, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { filename, originalname, mimetype, size, path: filePath } = req.file;
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
    const fileType = mimetype.split('/')[0];

    try {
        const [result] = await pool.query(
            `INSERT INTO media_library (filename, original_filename, file_path, file_url, file_type,
            mime_type, file_size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [filename, originalname, filePath, fileUrl, fileType, mimetype, size, req.user.id]
        );

        await logActivity(req.user.id, 'upload', 'media', result.insertId, `Uploaded file: ${originalname}`, req.ip, req.get('user-agent'));

        res.json({
            message: 'File uploaded successfully',
            file: {
                id: result.insertId,
                filename,
                original_filename: originalname,
                file_url: fileUrl,
                file_type: fileType,
                file_size: size
            }
        });
    } catch (error) {
        console.error('Error saving media:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all media
app.get('/api/admin/media', authenticateToken, async (req, res) => {
    try {
        const [media] = await pool.query(
            'SELECT * FROM media_library ORDER BY created_at DESC'
        );
        res.json({ media });
    } catch (error) {
        console.error('Error fetching media:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== ANALYTICS ROUTES ====================

// Track page view
app.post('/api/analytics/track', async (req, res) => {
    const { event_type, page_url, reference_id, reference_type } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    try {
        await pool.query(
            'INSERT INTO analytics (event_type, page_url, reference_id, reference_type, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [event_type, page_url, reference_id, reference_type, ipAddress, userAgent]
        );
        res.json({ message: 'Event tracked' });
    } catch (error) {
        console.error('Error tracking analytics:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get analytics dashboard data (Admin)
app.get('/api/admin/analytics/dashboard', authenticateToken, async (req, res) => {
    try {
        // Get total counts
        const [projectCount] = await pool.query('SELECT COUNT(*) as count FROM projects WHERE status = "published"');
        const [blogCount] = await pool.query('SELECT COUNT(*) as count FROM blog_posts WHERE status = "published"');
        const [contactCount] = await pool.query('SELECT COUNT(*) as count FROM contact_submissions WHERE status = "new"');
        const [totalViews] = await pool.query('SELECT SUM(views_count) as count FROM projects');

        // Get recent activity
        const [recentActivity] = await pool.query(
            'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10'
        );

        res.json({
            stats: {
                totalProjects: projectCount[0].count,
                totalBlogs: blogCount[0].count,
                newContacts: contactCount[0].count,
                totalViews: totalViews[0].count || 0
            },
            recentActivity
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== SITE SETTINGS ROUTES ====================

// Get all settings (Admin)
app.get('/api/admin/settings', authenticateToken, async (req, res) => {
    try {
        const [settings] = await pool.query('SELECT * FROM site_settings ORDER BY category, setting_key');
        res.json({ settings });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update setting (Admin)
app.put('/api/admin/settings/:key', authenticateToken, checkPermission(['super_admin', 'admin']), async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;

    try {
        await pool.query(
            'UPDATE site_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
            [value, req.user.id, key]
        );

        await logActivity(req.user.id, 'update', 'setting', null, `Updated setting: ${key}`, req.ip, req.get('user-agent'));
        res.json({ message: 'Setting updated successfully' });
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}/api`);
});
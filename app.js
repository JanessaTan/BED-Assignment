const express = require('express');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');

require('dotenv').config();

const app = express();
const frontendPath = path.join(__dirname, 'FED-Assignment-main');

// ===== General Middleware =====

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(frontendPath));

// ===== Health Check =====

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'HawkerHub API is running',
        data: {
            database: 'HawkerCentreManagementSystem'
        }
    });
});

// ===== Swagger Documentation =====

const openApiPath = path.join(__dirname, 'docs', 'openapi.yaml');

if (fs.existsSync(openApiPath)) {
    const openApiDocument = yaml.load(
        fs.readFileSync(openApiPath, 'utf8')
    );

    app.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(openApiDocument)
    );

    app.get('/api-docs.json', (req, res) => {
        res.json(openApiDocument);
    });
} else {
    console.warn(
        'Swagger documentation was not loaded because docs/openapi.yaml was not found.'
    );
}

// ===== You guys can update your routes here =====

// Authentication
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// User Account CRUD
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Menu Item CRUD
const menuItemRoutes = require('./routes/menuItemRoutes');
app.use('/api/menu-items', menuItemRoutes);

// Cuisine retrieval
const cuisineRoutes = require('./routes/cuisineRoutes');
app.use('/api/cuisines', cuisineRoutes);

// Promotion CRUD
const promotionRoutes = require('./routes/promotionRoutes');
app.use('/api/promotions', promotionRoutes);

const stallRoutes = require('./routes/stallRoutes');
app.use('/api/stalls', stallRoutes);

const feedbackRoutes = require('./routes/feedbackRoutes');
app.use('/api/feedback', feedbackRoutes);

const checkoutRoutes = require('./routes/checkoutRoute');
app.use('/api/checkout', checkoutRoutes);

const hygieneRoutes = require('./routes/hygieneRoute');
app.use('/api/hygiene', hygieneRoutes);

const orderRoutes = require('./routes/orderRoute');
app.use('/api/orders', orderRoutes);

const likeRoutes = require('./routes/likeRoutes');
app.use('/api/likes', likeRoutes);

const salesRoutes = require('./routes/salesRoutes');
app.use('/api/sales', salesRoutes);

const hawkerCentreRoutes = require('./routes/browsehawkercentre');
app.use('/api/hawkercentres', hawkerCentreRoutes);

// ===== Home Page =====

app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// ===== Error Handling =====

const {
    notFound,
    errorHandler
} = require('./middlewares/errorHandler');

app.use(notFound);
app.use(errorHandler);

// ===== Start Server =====

const PORT = process.env.PORT || 3000;

// This condition lets Jest and Supertest import app.js
// without automatically starting another server.
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Swagger documentation: http://localhost:${PORT}/api-docs`);
    });
}

module.exports = app;
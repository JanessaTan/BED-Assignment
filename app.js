const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'FED-Assignment-main')));

const { verifyJWT } = require("./middlewares/auth");

// ===== You guys can update your routes here =====

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

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

const salesRoutes = require("./routes/salesRoutes");
app.use("/api/sales", salesRoutes);

const menuRoutes = require('./routes/menuRoutes');
app.use('/api/stalls', menuRoutes);

const promotionRoutes = require('./routes/promotionRoutes');
app.use('/api/stalls', promotionRoutes);

const promotionController = require('./controllers/promotionController');
app.get('/api/promotions', promotionController.listAllActivePromotions);

const hawkerCentreRoutes = require('./routes/browsehawkercentre');
app.use('/api/hawkercentres', hawkerCentreRoutes);

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'FED-Assignment-main', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

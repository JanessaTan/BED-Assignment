const express = require("express");
const fs = require("fs");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const yaml = require("js-yaml");

require("dotenv").config();

// Route imports
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const menuItemRoutes = require("./routes/menuItemRoutes");
const cuisineRoutes = require("./routes/cuisineRoutes");
const promotionRoutes = require("./routes/promotionRoutes");
const stallRoutes = require("./routes/stallRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const checkoutRoutes = require("./routes/checkoutRoute");
const hygieneRoutes = require("./routes/hygieneRoute");
const orderRoutes = require("./routes/orderRoute");
const likeRoutes = require("./routes/likeRoutes");
const salesRoutes = require("./routes/salesRoutes");
const browseHawkerCentreRoutes = require(
    "./routes/browseHawkerCentreRoutes"
);

// Error-handling middleware
const {
    notFound,
    errorHandler
} = require("./middlewares/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

// Change this to "views" if your frontend files are inside the views folder.
const frontendPath = path.join(__dirname, "FED-Assignment-main");

// =========================================================
// General Middleware
// =========================================================

app.disable("x-powered-by");

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(frontendPath));

// =========================================================
// Health Check
// =========================================================

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "HawkerHub API is running",
        data: {
            database: "HawkerCentreManagementSystem"
        }
    });
});

// =========================================================
// Swagger Documentation
// =========================================================

const openApiPath = path.join(
    __dirname,
    "docs",
    "openapi.yaml"
);

if (fs.existsSync(openApiPath)) {
    const openApiDocument = yaml.load(
        fs.readFileSync(openApiPath, "utf8")
    );

    app.use(
        "/api-docs",
        swaggerUi.serve,
        swaggerUi.setup(openApiDocument)
    );

    app.get("/api-docs.json", (req, res) => {
        res.json(openApiDocument);
    });
} else {
    console.warn(
        "Swagger documentation was not loaded because " +
        "docs/openapi.yaml was not found."
    );
}

// =========================================================
// API Routes
// =========================================================

// Authentication
app.use("/api/auth", authRoutes);

// User Account Management
app.use("/api/users", userRoutes);

// Menu Item Management
app.use("/api/menu-items", menuItemRoutes);

// Cuisine Retrieval
app.use("/api/cuisines", cuisineRoutes);

// Promotion Management
app.use("/api/promotions", promotionRoutes);

// Stall Management
app.use("/api/stalls", stallRoutes);

// Feedback Management
app.use("/api/feedback", feedbackRoutes);

// Checkout
app.use("/api/checkout", checkoutRoutes);

// Hygiene
app.use("/api/hygiene", hygieneRoutes);

// Orders
app.use("/api/orders", orderRoutes);

// Likes
app.use("/api/likes", likeRoutes);

// Sales
app.use("/api/sales", salesRoutes);

// Hawker Centre Browsing
app.use("/api/hawkercentres", browseHawkerCentreRoutes);

// =========================================================
// Home Page
// =========================================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(frontendPath, "index.html")
    );
});

// =========================================================
// Error Handling
// =========================================================

app.use(notFound);
app.use(errorHandler);

// =========================================================
// Start Server
// =========================================================

// Prevents the server from starting automatically when app.js
// is imported by Jest or Supertest.
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(
            `Server running on http://localhost:${PORT}`
        );

        console.log(
            `Swagger documentation: ` +
            `http://localhost:${PORT}/api-docs`
        );
    });
}

module.exports = app;
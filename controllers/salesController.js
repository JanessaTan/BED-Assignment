const salesDashboardModel = require("../models/salesModel");

async function getDashboard(req, res) {
    try {
        const endDate = new Date();

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 365); // Last 365 days

        const summary = await salesDashboardModel.getSalesSummary(startDate, endDate);

        res.json({
            summary
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Database error." });
    }
}

module.exports = {
    getDashboard
};
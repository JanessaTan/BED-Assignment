const salesDashboardModel = require("../models/salesModel");

async function getDashboard(req, res) {
    try {
        const { startDate, endDate } = req.query;

        const summary = await salesDashboardModel.getSalesSummary(startDate, endDate);
        const topQuantity = await salesDashboardModel.getTopItemsByQuantity(startDate, endDate);
        const topRevenue = await salesDashboardModel.getTopItemsByRevenue(startDate, endDate);

        res.json({
            summary,
            topQuantity,
            topRevenue
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Database error." });
    }
}

module.exports = {
    getDashboard
};
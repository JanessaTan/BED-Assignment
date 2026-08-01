const salesModel = require("../models/salesModel");

async function getDashboard(req, res) {
    try {
        const endDate = new Date();

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 365);

        const summary = await salesModel.getSalesSummary(
            startDate,
            endDate
            );

        const salesTrend = await salesModel.getSalesTrend(
            startDate,
            endDate
            );

        const popularItems =
            await salesModel.getTopItemsByQuantity(
                startDate,
                endDate
            );

        res.json({
            summary,
            popularItems,
            salesTrend
        });

    } catch(error){
        console.error(error);
        res.status(500).json({
            message:"Database error"
        });
    }
}


module.exports = {
    getDashboard
};
const salesModel = require("../models/salesModel");

async function getDashboard(req, res) {
    try {
        const endDate = new Date();

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 365);
        const stallId = "S001" //hardcode for testing

        const summary = await salesModel.getSalesSummary(
            startDate,
            endDate,
            stallId
            );

        const salesTrend = await salesModel.getSalesTrend(
            startDate,
            endDate,
            stallId
            );

        const popularItems =
            await salesModel.getTopItemsByQuantity(
                startDate,
                endDate,
                stallId
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
const salesModel = require("../models/salesModel");
const userModel = require("../models/userModel");

const EARLIEST_POSSIBLE_DATE = new Date("2000-01-01");
const LATEST_POSSIBLE_DATE = new Date("2100-01-01");

async function getDashboard(req, res) {
    try {
        const endDate = LATEST_POSSIBLE_DATE;
        const startDate = EARLIEST_POSSIBLE_DATE;

        const requestingUser = await userModel.findById(req.body.customerID);//req.user.userId);
        const stallId = requestingUser?.stallId;
        if (!stallId) {
            return res.status(404).json({
                message: "No stall is currently associated with this vendor account"
            });
        }

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
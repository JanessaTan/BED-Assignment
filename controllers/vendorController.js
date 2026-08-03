const { sql, poolPromise } = require("../dbConfig");


async function getVendorStall(req, res) {
    try {
        const userId = req.user.userId;
        const connection = await poolPromise;
        const result = await connection.request()
            .input("userId", sql.Int, userId)
            .query(`
                SELECT 
                    fs.StallID
                FROM StallOwner so

                INNER JOIN FoodStall fs
                ON so.OwnerID = fs.OwnerID

                WHERE so.LinkedUserID = @userId
            `);

        if (result.recordset.length === 0) {

            return res.status(404).json({
                message: "Vendor stall not found"
            });
        }

        res.json({
            stallId: result.recordset[0].StallID
        });

    } catch(error) {

        console.error(
            "Get vendor stall error:",
            error
        );

        res.status(500).json({
            message: "Database error"
        });
    }
}

module.exports = {
    getVendorStall
};
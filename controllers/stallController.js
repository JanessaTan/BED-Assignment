const stallModel = require("../models/stallModel");

// GET /api/stalls?hc=HC01
async function getAllStalls(req, res) {
    try {
        const stalls = await stallModel.getAllStalls(req.query.hc);

        return res.status(200).json(stalls);
    } catch (error) {
        console.error("Error fetching stalls:", error);

        return res.status(500).json({
            message: "Error fetching stalls",
            error: error.message
        });
    }
}

// GET /api/stalls/:id
async function getStall(req, res) {
    try {
        const stall = await stallModel.getStallById(req.params.id);

        if (!stall) {
            return res.status(404).json({
                message: "Stall not found"
            });
        }

        return res.status(200).json(stall);
    } catch (error) {
        console.error("Error fetching stall:", error);

        return res.status(500).json({
            message: "Error fetching stall",
            error: error.message
        });
    }
}

// GET /api/stalls/:id/menu
async function getStallMenu(req, res) {
    try {
        const stall = await stallModel.getStallById(req.params.id);

        if (!stall) {
            return res.status(404).json({
                message: "Stall not found"
            });
        }

        const menuItems = await stallModel.getMenuByStallId(
            req.params.id
        );

        return res.status(200).json({
            stall: stall.StallName,
            menu: menuItems
        });
    } catch (error) {
        console.error("Error fetching stall menu:", error);

        return res.status(500).json({
            message: "Error fetching menu",
            error: error.message
        });
    }
}

// POST /api/stalls
async function addStall(req, res) {
    try {
        const {
            stallUnitNo,
            stallName,
            stallDesc,
            hawkerCentreId
        } = req.body;

        if (!stallName || !hawkerCentreId) {
            return res.status(400).json({
                message:
                    "stallName and hawkerCentreId are required"
            });
        }

        const newStall = await stallModel.createStall({
            stallUnitNo,
            stallName,
            stallDesc,
            hawkerCentreId
        });

        return res.status(201).json(newStall);
    } catch (error) {
        console.error("Error creating stall:", error);

        return res.status(500).json({
            message: "Error creating stall",
            error: error.message
        });
    }
}

// PUT /api/stalls/:id
async function editStall(req, res) {
    try {
        const { stallName, stallDesc } = req.body;

        if (!stallName) {
            return res.status(400).json({
                message: "stallName is required"
            });
        }

        const existingStall = await stallModel.getStallById(
            req.params.id
        );

        if (!existingStall) {
            return res.status(404).json({
                message: "Stall not found"
            });
        }

        const updatedStall = await stallModel.updateStall(
            req.params.id,
            {
                stallName,
                stallDesc
            }
        );

        return res.status(200).json(updatedStall);
    } catch (error) {
        console.error("Error updating stall:", error);

        return res.status(500).json({
            message: "Error updating stall",
            error: error.message
        });
    }
}

// DELETE /api/stalls/:id
async function removeStall(req, res) {
    try {
        const existingStall = await stallModel.getStallById(
            req.params.id
        );

        if (!existingStall) {
            return res.status(404).json({
                message: "Stall not found"
            });
        }

        await stallModel.deleteStall(req.params.id);

        return res.status(200).json({
            message: "Stall deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting stall:", error);

        return res.status(500).json({
            message: "Error deleting stall",
            error: error.message
        });
    }
}

module.exports = {
    getAllStalls,
    getStall,
    getStallMenu,
    addStall,
    editStall,
    removeStall
};
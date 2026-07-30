const stallModel = require('../models/stallModel');

// GET /api/stalls?hc=HC01
async function getStalls(req, res) {
    try {
        const stalls = await stallModel.getAllStalls(req.query.hc);
        res.status(200).json(stalls);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching stalls', error: err.message });
    }
}

// GET /api/stalls/:id
async function getStall(req, res) {
    try {
        const stall = await stallModel.getStallById(req.params.id);
        if (!stall) {
            return res.status(404).json({ message: 'Stall not found' });
        }
        res.status(200).json(stall);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching stall' });
    }
}

// GET /api/stalls/:id/menu  (US-C1: Browse Food Stalls & Menus)
async function getStallMenu(req, res) {
    try {
        const stall = await stallModel.getStallById(req.params.id);
        if (!stall) {
            return res.status(404).json({ message: 'Stall not found' });
        }

        const menuItems = await stallModel.getMenuByStallId(req.params.id);
        res.status(200).json({ stall: stall.StallName, menu: menuItems });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching menu', error: err.message });
    }
}

// POST /api/stalls
async function addStall(req, res) {
    try {
        const { stallUnitNo, stallName, stallDesc, hawkerCentreId } = req.body;

        // basic input validation - matches actual FoodStall columns
        if (!stallName || !hawkerCentreId) {
            return res.status(400).json({ message: 'stallName and hawkerCentreId are required' });
        }

        const newStall = await stallModel.createStall({ stallUnitNo, stallName, stallDesc, hawkerCentreId });
        res.status(201).json(newStall);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating stall', error: err.message });
    }
}

// PUT /api/stalls/:id
async function editStall(req, res) {
    try {
        const { stallName, stallDesc } = req.body;
        if (!stallName) {
            return res.status(400).json({ message: 'stallName is required' });
        }

        const existing = await stallModel.getStallById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: 'Stall not found' });
        }

        const updated = await stallModel.updateStall(req.params.id, { stallName, stallDesc });
        res.status(200).json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating stall', error: err.message });
    }
}

// DELETE /api/stalls/:id
async function removeStall(req, res) {
    try {
        const existing = await stallModel.getStallById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: 'Stall not found' });
        }

        await stallModel.deleteStall(req.params.id);
        res.status(200).json({ message: 'Stall deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting stall', error: err.message });
    }
}

module.exports = { getStalls, getStall, addStall, editStall, removeStall, getStallMenu };

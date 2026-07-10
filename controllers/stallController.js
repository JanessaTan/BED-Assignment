const stallModel = require('../models/stallModel');

// GET /api/stalls
async function getStalls(req, res) {
    try {
        const stalls = await stallModel.getAllStalls();
        res.status(200).json(stalls);
    }catch (err){
        console.error(err);
        res.status(500).json({ message: 'Error fetching stalls', error: err.message });
        
    }
}

// GET /api/stalls/:id
async function getStall(req, res) {
    try {
        const stall = await stallModel.getStallById(req.params.id);
        if (!stall) {
            return res.status(404).json({message: 'Stall not found' });
        }
        res.status(200).json(stall);
    }catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching stall', error:err.message });
    }
}

// POST /api/stalls
async function addStall(req, res) {
    try {
        const { stallName, cuisineType, centreId, ownerId } = req.body;

        // basicinput validation
        if (!stallName || !centreId || !ownerId) {
            return res.status(400).json({ message: 'stallName, centreId and ownerId are required' });
        }

        const newStall = await stallModel.createStall({ stallName, cuisineType, centreId, ownerId });
        res.status(201).json(newStall);
    }catch (err) {
        console.error(err);
        res.status(500).json({message: 'Error reating stall', error: err.message });

    }
}

//PUT /api/stalls/:id
async function editStall(req, res) {
    try {
        const { stallName, cuisineType } = req.body;
        if (!stallName) {
            return res.status(400).json({ message: 'stallName is required' });
        }
        
        const existing = await stallModel.getStallById(req.params.id);
        if (!existing) {
            return res.status(404).json ({message: 'Stall not found' });
        }

        const updated = await stallModel.updateStall(req.params.id, { stallName, cuisineType });
        res.status(200).json(updated);
    }catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating stall', error: err.message });
    }    
}

// DELETE /api/stalls/:is
async function removeStall(req, res) {
    try {
        const existing = await stallModel.getStallById(req.params.id);
        if (!existing) {
            return res.status(400).json({ message: 'Stall not found' });
        }

        await stallModel.deleteStall(req.params.is);
        res.status(200).json({message: 'Stall deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting stall', error: err.message });
    }
}

module.exports = {getStalls, getStall, addStall, editStall, removeStall };
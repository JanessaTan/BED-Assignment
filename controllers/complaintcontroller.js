const complaintModel = require('../models/complaintModel');

// GET /api/complaints  (US-O2: Operator views all customer complaints)
async function getComplaints(req, res) {
    try {
        const complaints = await complaintModel.getAllComplaints();
        res.status(200).json(complaints);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching complaints', error: err.message });
    }
}

// GET /api/complaints/:id
async function getComplaint(req, res) {
    try {
        const complaint = await complaintModel.getComplaintById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }
        res.status(200).json(complaint);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching complaint', error: err.message });
    }
}

// GET /api/complaints/stall/:stallId
async function getComplaintsByStall(req, res) {
    try {
        const complaints = await complaintModel.getComplaintsByStall(req.params.stallId);
        res.status(200).json(complaints);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching stall complaints', error: err.message });
    }
}

// GET /api/complaints/customer/:customerId
async function getComplaintsByCustomer(req, res) {
    try {
        const complaints = await complaintModel.getComplaintsByCustomer(req.params.customerId);
        res.status(200).json(complaints);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching customer complaints', error: err.message });
    }
}

module.exports = {
    getComplaints,
    getComplaint,
    getComplaintsByStall,
    getComplaintsByCustomer
};
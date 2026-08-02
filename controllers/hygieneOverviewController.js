const hygieneOverviewModel = require('../models/hygieneOverviewModel');

// GET /api/hygiene-overview  (US-O3: operator views hygiene grades of ALL stalls)
async function getAllStallHygieneGrades(req, res) {
    try {
        const grades = await hygieneOverviewModel.getAllStallHygieneGrades();
        res.status(200).json(grades);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching stall hygiene grades', error: err.message });
    }
}

// GET /api/hygiene-overview/stall/:stallId/history
async function getHygieneHistoryByStall(req, res) {
    try {
        const history = await hygieneOverviewModel.getHygieneHistoryByStall(req.params.stallId);
        res.status(200).json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching hygiene history', error: err.message });
    }
}

// GET /api/hygiene-overview/grade/:grade  e.g. /grade/D
async function getStallsByGrade(req, res) {
    try {
        const stalls = await hygieneOverviewModel.getStallsByGrade(req.params.grade);
        res.status(200).json(stalls);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching stalls by grade', error: err.message });
    }
}

module.exports = {
    getAllStallHygieneGrades,
    getHygieneHistoryByStall,
    getStallsByGrade
};
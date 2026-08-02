const rentalModel = require('../models/rentalModel');
const Joi = require('joi');

const agreementSchema = Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date().greater(Joi.ref('startDate')).required(),
    termCondition: Joi.string().max(200).allow('', null),
    rentalPrice: Joi.number().positive().required(),
    ownerId: Joi.string().max(5).required(),
    stallId: Joi.string().max(4).required()
});

// GET /api/rentals  (US-O1: operator views all recorded agreements)
async function getAgreements(req, res) {
    try {
        const agreements = await rentalModel.getAllAgreements();
        res.status(200).json(agreements);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching rental agreements', error: err.message });
    }
}

// GET /api/rentals/:id
async function getAgreement(req, res) {
    try {
        const agreement = await rentalModel.getAgreementById(req.params.id);
        if (!agreement) {
            return res.status(404).json({ message: 'Rental agreement not found' });
        }
        res.status(200).json(agreement);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching rental agreement', error: err.message });
    }
}

// GET /api/rentals/owner/:ownerId  (US-SO1: stall owner views their own agreements)
async function getAgreementsByOwner(req, res) {
    try {
        const agreements = await rentalModel.getAgreementsByOwner(req.params.ownerId);
        res.status(200).json(agreements);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching owner agreements', error: err.message });
    }
}

// GET /api/rentals/stall/:stallId  (US-O1: operator checks a stall's rental history)
async function getAgreementsByStall(req, res) {
    try {
        const agreements = await rentalModel.getAgreementsByStall(req.params.stallId);
        res.status(200).json(agreements);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching stall agreements', error: err.message });
    }
}

// POST /api/rentals  (US-SO1: Sign Rental Agreement)
async function signAgreement(req, res) {
    try {
        const { error, value } = agreementSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const newAgreement = await rentalModel.createAgreement(value);
        res.status(201).json(newAgreement);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error signing rental agreement', error: err.message });
    }
}

// PUT /api/rentals/:id
async function editAgreement(req, res) {
    try {
        const { error, value } = agreementSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const existing = await rentalModel.getAgreementById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: 'Rental agreement not found' });
        }

        const updated = await rentalModel.updateAgreement(req.params.id, value);
        res.status(200).json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating rental agreement', error: err.message });
    }
}

// DELETE /api/rentals/:id
async function removeAgreement(req, res) {
    try {
        const existing = await rentalModel.getAgreementById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: 'Rental agreement not found' });
        }

        await rentalModel.deleteAgreement(req.params.id);
        res.status(200).json({ message: 'Rental agreement deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting rental agreement', error: err.message });
    }
}

module.exports = {
    getAgreements,
    getAgreement,
    getAgreementsByOwner,
    getAgreementsByStall,
    signAgreement,
    editAgreement,
    removeAgreement
};
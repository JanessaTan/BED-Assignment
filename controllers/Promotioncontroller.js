const promotionModel = require('../models/promotionModel');

// GET /api/stalls/:id/promotions
async function listPromotions(req, res) {
  try {
    const promotions = await promotionModel.getPromotionsByStall(req.params.id);
    res.status(200).json(promotions);
  } catch (err) {
    console.error('listPromotions error:', err);
    res.status(500).json({ message: 'Unable to retrieve promotions. Please try again later.' });
  }
}

// GET /api/stalls/:id/promotions/active  (for Janessa's US-C8)
async function listActivePromotions(req, res) {
  try {
    const promotions = await promotionModel.getActivePromotionsByStall(req.params.id);
    res.status(200).json(promotions);
  } catch (err) {
    console.error('listActivePromotions error:', err);
    res.status(500).json({ message: 'Unable to retrieve active promotions. Please try again later.' });
  }
}

// POST /api/stalls/:id/promotions   (vendor only, own stall only)
async function createPromotion(req, res) {
  try {
    const stallId = req.params.id;
    const { promoDesc, promoStartDate, promoEndDate } = req.body;

    if (!promoDesc || !promoStartDate || !promoEndDate) {
      return res.status(400).json({ message: 'promoDesc, promoStartDate and promoEndDate are required.' });
    }
    const start = new Date(promoStartDate);
    const end = new Date(promoEndDate);
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ message: 'promoStartDate and promoEndDate must be valid dates.' });
    }
    if (end <= start) {
      return res.status(400).json({ message: 'promoEndDate must be after promoStartDate.' });
    }

    const owns = await promotionModel.isStallOwnedBy(stallId, req.user.ownerId);
    if (!owns) {
      return res.status(403).json({ message: 'You do not have permission to manage promotions for this stall.' });
    }

    const created = await promotionModel.createPromotion({ stallId, promoDesc, promoStartDate, promoEndDate });
    res.status(201).json(created);
  } catch (err) {
    console.error('createPromotion error:', err);
    res.status(500).json({ message: 'Unable to create the promotion. Please try again later.' });
  }
}

// PUT /api/stalls/:id/promotions/:promoId   (vendor only, own stall only)
async function updatePromotion(req, res) {
  try {
    const stallId = req.params.id;
    const { promoId } = req.params;
    const { promoDesc, promoStartDate, promoEndDate } = req.body;

    const owns = await promotionModel.isStallOwnedBy(stallId, req.user.ownerId);
    if (!owns) {
      return res.status(403).json({ message: 'You do not have permission to manage promotions for this stall.' });
    }

    const existing = await promotionModel.getPromotionById(promoId);
    if (!existing || existing.StallID !== stallId) {
      return res.status(404).json({ message: 'Promotion not found for this stall.' });
    }

    const start = promoStartDate ? new Date(promoStartDate) : existing.PromoStartDate;
    const end = promoEndDate ? new Date(promoEndDate) : existing.PromoEndDate;
    if (end <= start) {
      return res.status(400).json({ message: 'promoEndDate must be after promoStartDate.' });
    }

    await promotionModel.updatePromotion(promoId, {
      promoDesc: promoDesc ?? existing.PromoDesc,
      promoStartDate: start,
      promoEndDate: end,
    });
    res.status(200).json({ message: 'Promotion updated successfully.' });
  } catch (err) {
    console.error('updatePromotion error:', err);
    res.status(500).json({ message: 'Unable to update the promotion. Please try again later.' });
  }
}

// DELETE /api/stalls/:id/promotions/:promoId   (vendor only, own stall only)
async function deletePromotion(req, res) {
  try {
    const stallId = req.params.id;
    const { promoId } = req.params;

    const owns = await promotionModel.isStallOwnedBy(stallId, req.user.ownerId);
    if (!owns) {
      return res.status(403).json({ message: 'You do not have permission to manage promotions for this stall.' });
    }

    const existing = await promotionModel.getPromotionById(promoId);
    if (!existing || existing.StallID !== stallId) {
      return res.status(404).json({ message: 'Promotion not found for this stall.' });
    }

    await promotionModel.deletePromotion(promoId);
    res.status(200).json({ message: 'Promotion deleted successfully.' });
  } catch (err) {
    console.error('deletePromotion error:', err);
    res.status(500).json({ message: 'Unable to delete the promotion. Please try again later.' });
  }
}

async function listAllActivePromotions(req, res) {
  try {
    const promotions = await promotionModel.getAllActivePromotions();
    res.status(200).json(promotions);
  } catch (err) {
    console.error('listAllActivePromotions error:', err);
    res.status(500).json({ message: 'Unable to retrieve promotions. Please try again later.' });
  }
}

module.exports = {
  listPromotions,
  listActivePromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
};
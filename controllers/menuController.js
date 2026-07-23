const menuModel = require('../models/menuModel');

// GET /api/stalls/:stallId/menu
async function listMenuItems(req, res) {
  try {
    const items = await menuModel.getMenuItemsByStall(req.params.id);
    res.status(200).json(items);
  } catch (err) {
    console.error('listMenuItems error:', err);
    res.status(500).json({ message: 'Unable to retrieve menu items. Please try again later.' });
  }
}

// GET /api/stalls/:stallId/menu/:itemCode
async function getMenuItem(req, res) {
  try {
    const item = await menuModel.getMenuItemById(req.params.id, req.params.itemCode);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found.' });
    }
    res.status(200).json(item);
  } catch (err) {
    console.error('getMenuItem error:', err);
    res.status(500).json({ message: 'Unable to retrieve the menu item. Please try again later.' });
  }
}

// POST /api/stalls/:stallId/menu   (vendor only, own stall only)
async function createMenuItem(req, res) {
  try {
    const stallId = req.params.id;
    const { itemDesc, itemPrice, itemCategory, cuisineIds } = req.body;

    if (!itemDesc || itemPrice === undefined || !itemCategory) {
      return res.status(400).json({ message: 'itemDesc, itemPrice and itemCategory are required.' });
    }
    if (isNaN(itemPrice) || itemPrice < 0) {
      return res.status(400).json({ message: 'itemPrice must be a non-negative number.' });
    }

    const owns = await menuModel.isStallOwnedBy(stallId, req.user.ownerId);
    if (!owns) {
      return res.status(403).json({ message: 'You do not have permission to modify this stall\'s menu.' });
    }

    const created = await menuModel.createMenuItem({ stallId, itemDesc, itemPrice, itemCategory, cuisineIds });
    res.status(201).json(created);
  } catch (err) {
    console.error('createMenuItem error:', err);
    res.status(500).json({ message: 'Unable to create the menu item. Please try again later.' });
  }
}

// PUT /api/stalls/:stallId/menu/:itemCode   (vendor only, own stall only)
async function updateMenuItem(req, res) {
  try {
    const stallId = req.params.id;
    const { itemCode } = req.params;
    const { itemDesc, itemPrice, itemCategory, cuisineIds } = req.body;

    if (itemPrice !== undefined && (isNaN(itemPrice) || itemPrice < 0)) {
      return res.status(400).json({ message: 'itemPrice must be a non-negative number.' });
    }

    const owns = await menuModel.isStallOwnedBy(stallId, req.user.ownerId);
    if (!owns) {
      return res.status(403).json({ message: 'You do not have permission to modify this stall\'s menu.' });
    }

    const existing = await menuModel.getMenuItemById(stallId, itemCode);
    if (!existing) {
      return res.status(404).json({ message: 'Menu item not found.' });
    }

    await menuModel.updateMenuItem(stallId, itemCode, {
      itemDesc: itemDesc ?? existing.ItemDesc,
      itemPrice: itemPrice ?? existing.ItemPrice,
      itemCategory: itemCategory ?? existing.ItemCategory,
      cuisineIds,
    });
    res.status(200).json({ message: 'Menu item updated successfully.' });
  } catch (err) {
    console.error('updateMenuItem error:', err);
    res.status(500).json({ message: 'Unable to update the menu item. Please try again later.' });
  }
}

// DELETE /api/stalls/:stallId/menu/:itemCode   (vendor only, own stall only)
async function deleteMenuItem(req, res) {
  try {
    const stallId = req.params.id;
    const { itemCode } = req.params;

    const owns = await menuModel.isStallOwnedBy(stallId, req.user.ownerId);
    if (!owns) {
      return res.status(403).json({ message: 'You do not have permission to modify this stall\'s menu.' });
    }

    const existing = await menuModel.getMenuItemById(stallId, itemCode);
    if (!existing) {
      return res.status(404).json({ message: 'Menu item not found.' });
    }

    await menuModel.deleteMenuItem(stallId, itemCode);
    res.status(200).json({ message: 'Menu item deleted successfully.' });
  } catch (err) {
    console.error('deleteMenuItem error:', err);
    res.status(500).json({ message: 'Unable to delete the menu item. Please try again later.' });
  }
}

module.exports = {
  listMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
const hygieneModel = require("../models/hygieneModel");


// GET current hygiene

async function getCurrentHygiene(req,res){
    try{
        const stallId = req.params.id;
        const record = await hygieneModel.getCurrentHygiene(stallId);

        if(!record){
            return res.status(404).json({
                error:"No hygiene record found"
            });

        }
        res.json(record);

    }catch(error){
        console.error("Controller error:", error);
        res.status(500).json({
            error:"Error retrieving hygiene record"
        });
    }
}

// POST hygiene

async function createHygiene(req,res){
    try{
        await hygieneModel.createHygiene(req.body);
        res.status(201).json({
            message:"Hygiene record created successfully"
        });

    }catch(error){
        console.error("Controller error:", error);
        res.status(500).json({
            error:"Error creating hygiene record"
        });
    }
}


// PUT hygiene

async function updateHygiene(req,res){
    try{
        const inspectionId = req.params.id;
        const result = await hygieneModel.updateHygiene(
                inspectionId,
                req.body
            );

        if(result===0){
            return res.status(404).json({
                error:"Inspection not found"
            });
        }

        res.json({
            message:"Hygiene record updated successfully"
        });

    }catch(error){
        console.error("Controller error:", error);
        res.status(500).json({
            error:"Error updating hygiene record"
        });
    }
}

module.exports = {
    getCurrentHygiene,
    createHygiene,
    updateHygiene
};
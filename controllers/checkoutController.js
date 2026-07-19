const checkoutModel = require("../models/checkoutModel");

async function createOrder(req,res){
    try{
        console.log("Incoming order data:");
        console.log(req.body);

        const orderID = await checkoutModel.createOrder(req.body);

        res.status(201).json({
            message:"Order created successfully",
            OrderID: orderID
        });

    }catch(error){

    console.error("CREATE ORDER ERROR:");
    console.error(error);

    res.status(500).json({
        message:"Failed to create order",
        error:error.message
        });
    }
}


async function getOrder(req,res){

    try{

        const result = await checkoutModel.getOrder(req.params.id);

        res.json(result);

    }catch(error){

        console.error(error);

        res.status(500).json({
            message:"Failed to retrieve order"
        });

    }

}

module.exports = {
    createOrder,
    getOrder
};
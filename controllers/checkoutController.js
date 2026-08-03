const checkoutModel = require("../models/checkoutModel");

async function createOrder(req,res){
    try{
        console.log("Incoming order data:"); // for checking
        console.log(req.body);
        console.log(req.user);

        console.log("Authenticated user:", req.user);

        const customerId = await checkoutModel.getCustomerId(req.user.userId);

        console.log("Mapped CustomerID:", customerId);

        const data = {
            customerId,
            orderDate: req.body.orderDate,
            pmtType: req.body.pmtType,
            pickupTime: req.body.pickupTime,
            items: req.body.items
            
        };

        const orderID = await checkoutModel.createOrder(data);

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
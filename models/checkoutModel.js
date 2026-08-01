const { sql, poolPromise } = require('../dbConfig');

//Generate OrderID
async function generateOrderID(){
    const connection = await poolPromise;
    const result = await connection.request().query(`
        SELECT OrderID
        FROM CustOrder
    `);

    if(result.recordset.length === 0){
        return "O001";
    }

    let highest = 0;
    for (const row of result.recordset){
        const number = Number(
            row.OrderID.substring(1)
        );
        if(number > highest){
            highest = number;
        }
    }
    const nextNumber = highest + 1;
    return "O" + nextNumber.toString().padStart(3,"0");
}
//     const lastID = result.recordset[0].OrderID;

//     const number = parseInt(lastID.substring(1)) + 1;

//     return "O" + number.toString().padStart(3,"0");

// }


// CREATE ORDER
async function createOrder(data) {
    const connection = await poolPromise;

    // Generate a new OrderID
    const orderID = await generateOrderID();

    // Create CustOrder
    const orderRequest = connection.request();
    orderRequest.input("OrderID", orderID);
    orderRequest.input("OrderDate", data.orderDate);
    orderRequest.input("PmtType", data.pmtType);
    orderRequest.input("CustomerID", data.customerID);

    console.log("CustomerID being inserted:", data.customerID);
    await orderRequest.query(`
        INSERT INTO CustOrder
        (
            OrderID,
            OrderDate,
            PmtType,
            CustomerID
        )
        VALUES
        (
            @OrderID,
            @OrderDate,
            @PmtType,
            @CustomerID
        )
    `);

// create orderItems

    let itemNo = 1;

    for (const item of data.items) {

        const itemRequest = connection.request();

        itemRequest.input("OrderID", orderID);
        itemRequest.input("OrderItemNo", itemNo);
        itemRequest.input("StallID", item.StallID);
        itemRequest.input("ItemCode", item.ItemCode);
        itemRequest.input("Quantity", item.Quantity);
        itemRequest.input("UnitPrice", item.UnitPrice);


        await itemRequest.query(`
            INSERT INTO OrderItem
            (
                OrderID,
                OrderItemNo,
                StallID,
                ItemCode,
                Quantity,
                UnitPrice
            )
            VALUES
            (
                @OrderID,
                @OrderItemNo,
                @StallID,
                @ItemCode,
                @Quantity,
                @UnitPrice
            )
        `);

        itemNo++;
    }


    return orderID;
}


// GET ORDER DETAILS
async function getOrder(orderID){

    const connection = await poolPromise;

    const request = connection.request();

    request.input("OrderID", orderID);


    const result = await request.query(`
        SELECT
            O.OrderID,
            O.OrderDate,
            O.PmtType,
            O.CustomerID,
            OI.OrderItemNo,
            OI.StallID,
            OI.ItemCode,
            OI.Quantity,
            OI.UnitPrice

        FROM CustOrder O

        INNER JOIN OrderItem OI
        ON O.OrderID = OI.OrderID

        WHERE O.OrderID = @OrderID
    `);

    return result.recordset;
}

module.exports = {
    createOrder,
    getOrder
};
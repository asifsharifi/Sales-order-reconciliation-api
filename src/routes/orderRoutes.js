const express = require("express");
const { getPool, sql } = require("../db");

const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Return orders, optionally filtered by status
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         example: NEW
 *     responses:
 *       200:
 *         description: Orders returned successfully
 */
router.get("/", async (req, res, next) => {
  try {
    const pool = await getPool();
    const status = req.query.status;

    const request = pool.request();

    let query = `
      SELECT
        o.OrderID,
        o.ExternalOrderNo,
        o.CustomerID,
        c.CustomerName,
        o.OrderDate,
        o.OrderStatus,
        o.OrderTotal
      FROM dbo.Orders o
      LEFT JOIN dbo.Customers c ON c.CustomerID = o.CustomerID
    `;

    if (status) {
      request.input("status", sql.VarChar(30), status);
      query += " WHERE o.OrderStatus = @status";
    }

    query += " ORDER BY o.OrderID";

    const result = await request.query(query);

    res.json({
      success: true,
      count: result.recordset.length,
      data: result.recordset,
      requestId: req.requestId
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Return an order and its line items
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order found
 *       404:
 *         description: Order not found
 */
router.get("/:id", async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);

    if (!Number.isInteger(orderId)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_ORDER_ID", message: "Order ID must be an integer." },
        requestId: req.requestId
      });
    }

    const pool = await getPool();

    const orderResult = await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .query(`
        SELECT
          o.OrderID,
          o.ExternalOrderNo,
          o.CustomerID,
          c.CustomerName,
          o.OrderDate,
          o.OrderStatus,
          o.OrderTotal
        FROM dbo.Orders o
        LEFT JOIN dbo.Customers c ON c.CustomerID = o.CustomerID
        WHERE o.OrderID = @orderId
      `);

    if (orderResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: "ORDER_NOT_FOUND", message: `Order ${orderId} was not found.` },
        requestId: req.requestId
      });
    }

    const itemResult = await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .query(`
        SELECT
          oi.OrderItemID,
          oi.ProductID,
          p.ProductName,
          oi.Quantity,
          oi.UnitPrice,
          CAST(oi.Quantity * oi.UnitPrice AS DECIMAL(12,2)) AS LineTotal
        FROM dbo.OrderItems oi
        LEFT JOIN dbo.Products p ON p.ProductID = oi.ProductID
        WHERE oi.OrderID = @orderId
        ORDER BY oi.OrderItemID
      `);

    res.json({
      success: true,
      data: {
        ...orderResult.recordset[0],
        items: itemResult.recordset
      },
      requestId: req.requestId
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create an order header
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [externalOrderNo, customerId, orderTotal]
 *             properties:
 *               externalOrderNo:
 *                 type: string
 *                 example: WEB-2001
 *               customerId:
 *                 type: integer
 *                 example: 1
 *               orderStatus:
 *                 type: string
 *                 example: NEW
 *               orderTotal:
 *                 type: number
 *                 example: 1299.98
 *     responses:
 *       201:
 *         description: Order created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate external order number
 */
router.post("/", async (req, res, next) => {
  try {
    const {
      externalOrderNo,
      customerId,
      orderStatus = "NEW",
      orderTotal
    } = req.body;

    if (!externalOrderNo || !customerId || orderTotal === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "externalOrderNo, customerId and orderTotal are required."
        },
        requestId: req.requestId
      });
    }

    const pool = await getPool();

    const duplicate = await pool
      .request()
      .input("externalOrderNo", sql.VarChar(50), externalOrderNo)
      .query(`
        SELECT OrderID
        FROM dbo.Orders
        WHERE ExternalOrderNo = @externalOrderNo
      `);

    if (duplicate.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: "DUPLICATE_EXTERNAL_ORDER",
          message: `External order ${externalOrderNo} already exists.`
        },
        requestId: req.requestId
      });
    }

    const result = await pool
      .request()
      .input("externalOrderNo", sql.VarChar(50), externalOrderNo)
      .input("customerId", sql.Int, customerId)
      .input("orderStatus", sql.VarChar(30), orderStatus)
      .input("orderTotal", sql.Decimal(12, 2), orderTotal)
      .query(`
        INSERT INTO dbo.Orders
          (ExternalOrderNo, CustomerID, OrderDate, OrderStatus, OrderTotal)
        OUTPUT INSERTED.*
        VALUES
          (@externalOrderNo, @customerId, GETDATE(), @orderStatus, @orderTotal)
      `);

    res.status(201).json({
      success: true,
      data: result.recordset[0],
      requestId: req.requestId
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 example: SHIPPED
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Order not found
 */
router.put("/:id/status", async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    const allowed = ["NEW", "PROCESSING", "SHIPPED", "CANCELLED"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATUS",
          message: `status must be one of: ${allowed.join(", ")}`
        },
        requestId: req.requestId
      });
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .input("status", sql.VarChar(30), status)
      .query(`
        UPDATE dbo.Orders
        SET OrderStatus = @status
        OUTPUT INSERTED.*
        WHERE OrderID = @orderId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: "ORDER_NOT_FOUND", message: `Order ${orderId} was not found.` },
        requestId: req.requestId
      });
    }

    res.json({
      success: true,
      data: result.recordset[0],
      requestId: req.requestId
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete an order and its order items
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Deleted
 *       404:
 *         description: Order not found
 */
router.delete("/:id", async (req, res, next) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    const orderId = Number(req.params.id);

    await transaction.begin();

    const request = new sql.Request(transaction);
    request.input("orderId", sql.Int, orderId);

    const exists = await request.query(`
      SELECT OrderID FROM dbo.Orders WHERE OrderID = @orderId
    `);

    if (exists.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { code: "ORDER_NOT_FOUND", message: `Order ${orderId} was not found.` },
        requestId: req.requestId
      });
    }

    const deleteItems = new sql.Request(transaction);
    deleteItems.input("orderId", sql.Int, orderId);
    await deleteItems.query(`DELETE FROM dbo.OrderItems WHERE OrderID = @orderId`);

    const deleteOrder = new sql.Request(transaction);
    deleteOrder.input("orderId", sql.Int, orderId);
    await deleteOrder.query(`DELETE FROM dbo.Orders WHERE OrderID = @orderId`);

    await transaction.commit();
    res.status(204).send();
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (_) {}
    next(error);
  }
});

module.exports = router;

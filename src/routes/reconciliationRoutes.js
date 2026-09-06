
const express = require("express");
const { queryDatabase } = require("../db");

const router = express.Router();

/**
 * @swagger
 * /api/reconciliation/orders/{id}:
 *   get:
 *     summary: Reconcile an order and identify data discrepancies
 *     tags: [Reconciliation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reconciliation completed
 *       404:
 *         description: Order not found
 */
router.get("/orders/:id", async (req, res) => {

    try {

        const orderId = Number(req.params.id);

        if (!Number.isInteger(orderId)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_ORDER_ID",
                    message: "Order ID must be an integer."
                },
                requestId: req.requestId
            });
        }

        const orders = await queryDatabase(`
            SELECT
                o.OrderID,
                o.ExternalOrderNo,
                o.CustomerID,
                c.CustomerName,
                o.OrderTotal
            FROM dbo.Orders o
            LEFT JOIN dbo.Customers c
                ON c.CustomerID = o.CustomerID
            WHERE o.OrderID = ${orderId}
        `);

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "ORDER_NOT_FOUND",
                    message: `Order ${orderId} was not found.`
                },
                requestId: req.requestId
            });
        }

        const order = orders[0];

        const items = await queryDatabase(`
            SELECT
                oi.OrderItemID,
                oi.ProductID,
                p.ProductName,
                p.ListPrice,
                oi.Quantity,
                oi.UnitPrice,
                CAST(
                    oi.Quantity * oi.UnitPrice
                    AS DECIMAL(12,2)
                ) AS LineTotal
            FROM dbo.OrderItems oi
            LEFT JOIN dbo.Products p
                ON p.ProductID = oi.ProductID
            WHERE oi.OrderID = ${orderId}
        `);

        const discrepancies = [];

        if (!order.CustomerName) {
            discrepancies.push({
                type: "MISSING_CUSTOMER",
                severity: "HIGH",
                field: "CustomerID",
                actual: order.CustomerID,
                expected: "Existing CustomerID"
            });
        }

        if (items.length === 0) {
            discrepancies.push({
                type: "NO_ORDER_ITEMS",
                severity: "HIGH",
                actual: 0,
                expected: "At least one order item"
            });
        }

        for (const item of items) {

            if (!item.ProductName) {
                discrepancies.push({
                    type: "MISSING_PRODUCT",
                    severity: "HIGH",
                    field: "ProductID",
                    actual: item.ProductID,
                    expected: "Existing ProductID"
                });
            }

            if (Number(item.Quantity) <= 0) {
                discrepancies.push({
                    type: "INVALID_QUANTITY",
                    severity: "HIGH",
                    field: "Quantity",
                    actual: item.Quantity,
                    expected: "> 0"
                });
            }

            if (
                item.ListPrice !== null &&
                Math.abs(
                    Number(item.UnitPrice) -
                    Number(item.ListPrice)
                ) > 0.009
            ) {
                discrepancies.push({
                    type: "UNIT_PRICE_MISMATCH",
                    severity: "MEDIUM",
                    productId: item.ProductID,
                    actual: Number(item.UnitPrice),
                    expected: Number(item.ListPrice),
                    difference: Number(
                        (
                            Number(item.UnitPrice) -
                            Number(item.ListPrice)
                        ).toFixed(2)
                    )
                });
            }
        }

        const calculatedTotal = Number(
            items.reduce(
                (sum, item) =>
                    sum + Number(item.LineTotal || 0),
                0
            ).toFixed(2)
        );

        const storedTotal = Number(order.OrderTotal);

        if (
            Math.abs(
                storedTotal - calculatedTotal
            ) > 0.009
        ) {
            discrepancies.push({
                type: "ORDER_TOTAL_MISMATCH",
                severity: "HIGH",
                field: "OrderTotal",
                actual: storedTotal,
                expected: calculatedTotal,
                difference: Number(
                    (
                        storedTotal -
                        calculatedTotal
                    ).toFixed(2)
                )
            });
        }

        const duplicates = await queryDatabase(`
            SELECT COUNT(*) AS DuplicateCount
            FROM dbo.Orders
            WHERE ExternalOrderNo =
                '${order.ExternalOrderNo.replace(/'/g, "''")}'
        `);

        const duplicateCount =
            Number(duplicates[0].DuplicateCount);

        if (duplicateCount > 1) {
            discrepancies.push({
                type: "DUPLICATE_EXTERNAL_ORDER",
                severity: "HIGH",
                field: "ExternalOrderNo",
                actual: duplicateCount,
                expected: 1
            });
        }

        res.status(200).json({
            success: true,
            orderId: orderId,

            reconciliationStatus:
                discrepancies.length === 0
                    ? "PASSED"
                    : "FAILED",

            summary: {
                storedOrderTotal: storedTotal,
                calculatedItemTotal: calculatedTotal,
                discrepancyCount:
                    discrepancies.length
            },

            discrepancies: discrepancies,

            requestId: req.requestId
        });

    } catch (error) {

        console.error(
            "RECONCILIATION ERROR:"
        );

        console.dir(error, {
            depth: null
        });

        res.status(500).json({
            success: false,
            error: {
                code: "RECONCILIATION_ERROR",
                message:
                    "Unable to reconcile the order."
            },
            requestId: req.requestId
        });
    }
});

module.exports = router;
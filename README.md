# Sales Order Reconciliation API

REST API project demonstrating:

- Node.js + Express
- SQL Server
- Swagger/OpenAPI
- Postman
- CRUD-style API operations
- HTTP status codes
- Data reconciliation
- Error handling
- Request correlation IDs
- SQL/API discrepancy troubleshooting

## Project Scenario

An e-commerce system receives orders from an upstream application. The API exposes order data from SQL Server and provides reconciliation endpoints that identify differences between:

1. Order header totals and calculated order-item totals
2. Stored order-item prices and product master prices
3. Orders and valid customer records
4. Orders and valid product records
5. Valid and invalid quantities
6. Duplicate external order numbers

The seeded database intentionally contains both good and bad data so the project can be demonstrated during an interview.

## Setup

1. Open SQL Server Management Studio.
2. Run `sql/01-create-database.sql`.
3. Run `sql/02-seed-data.sql`.
4. Copy `.env.example` to `.env`.
5. Update your SQL Server login settings in `.env`.
6. Open the project folder in VS Code.
7. Run:

```bash
npm install
npm run dev
```

Swagger:
`http://localhost:3001/api-docs`

API health:
`http://localhost:3001/api/health`

## Main Demo Endpoints

```text
GET    /api/health
GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
PUT    /api/orders/:id/status
DELETE /api/orders/:id

GET    /api/reconciliation/summary
GET    /api/reconciliation/orders/:id
```

## Seeded Troubleshooting Cases

| Order | Scenario |
|---|---|
| 1001 | Clean order; reconciliation passes |
| 1002 | Header total does not match detail total |
| 1003 | Unit price differs from product master |
| 1004 | Missing customer and zero quantity |
| 1005/1006 | Duplicate external order number |

## Interview Demo Flow

Start with:

```http
GET /api/orders/1002
```

The API returns the order and detail records.

Next call:

```http
GET /api/reconciliation/orders/1002
```

The reconciliation endpoint returns `FAILED` and explains that the stored order total does not match the calculated detail total.

Validate the same data directly in SQL Server:

```sql
SELECT
    o.OrderID,
    o.OrderTotal AS StoredTotal,
    SUM(oi.Quantity * oi.UnitPrice) AS CalculatedTotal,
    o.OrderTotal - SUM(oi.Quantity * oi.UnitPrice) AS Difference
FROM dbo.Orders o
JOIN dbo.OrderItems oi
    ON oi.OrderID = o.OrderID
WHERE o.OrderID = 1002
GROUP BY o.OrderID, o.OrderTotal;
```

This demonstrates a practical troubleshooting workflow:

API response -> isolate record -> reproduce issue -> validate SQL source data -> identify discrepancy -> correct root cause -> retest API.

## Suggested Interview Explanation

"I created a Node.js/Express REST API connected to SQL Server and documented the endpoints with Swagger. I also created Postman tests. The interesting part is the reconciliation endpoint. When an API response looks incorrect, I don't assume the API itself is the problem. I capture the request ID and HTTP response, identify the affected record, reproduce the request, and validate the underlying SQL data. For example, order 1002 has a stored total of 700 while its line items calculate to 660. The API flags the 40-dollar difference and identifies it as an ORDER_TOTAL_MISMATCH. I can then determine whether the problem originates in the source data, transformation/business logic, or API layer, correct it, and retest."

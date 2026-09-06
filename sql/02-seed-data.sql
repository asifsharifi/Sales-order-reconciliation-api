USE SalesOrderAPI_DB;
GO

INSERT INTO dbo.Customers (CustomerID, CustomerName, Email, Region)
VALUES
(1, 'ABC Retail', 'ap@abcretail.demo', 'South'),
(2, 'Northwind Demo', 'orders@northwind.demo', 'North'),
(3, 'Contoso Demo', 'purchasing@contoso.demo', 'West');

INSERT INTO dbo.Products
(ProductID, ProductName, Category, ListPrice, IsActive)
VALUES
(101, 'Business Laptop', 'Computers', 1200.00, 1),
(102, '27-inch Monitor', 'Displays', 300.00, 1),
(103, 'USB-C Dock', 'Accessories', 180.00, 1),
(104, 'Wireless Mouse', 'Accessories', 40.00, 1);

-- 1001 = clean order
INSERT INTO dbo.Orders
(ExternalOrderNo, CustomerID, OrderDate, OrderStatus, OrderTotal)
VALUES
('WEB-1001', 1, DATEADD(day, -3, GETDATE()), 'NEW', 1500.00);

INSERT INTO dbo.OrderItems
(OrderID, ProductID, Quantity, UnitPrice)
VALUES
(1001, 101, 1, 1200.00),
(1001, 102, 1, 300.00);

-- 1002 = total discrepancy: detail = 660, header = 700
INSERT INTO dbo.Orders
(ExternalOrderNo, CustomerID, OrderDate, OrderStatus, OrderTotal)
VALUES
('WEB-1002', 2, DATEADD(day, -2, GETDATE()), 'PROCESSING', 700.00);

INSERT INTO dbo.OrderItems
(OrderID, ProductID, Quantity, UnitPrice)
VALUES
(1002, 102, 1, 300.00),
(1002, 103, 2, 180.00);

-- 1003 = unit-price discrepancy:
-- product master says mouse = 40, order has 55
INSERT INTO dbo.Orders
(ExternalOrderNo, CustomerID, OrderDate, OrderStatus, OrderTotal)
VALUES
('WEB-1003', 3, DATEADD(day, -1, GETDATE()), 'NEW', 110.00);

INSERT INTO dbo.OrderItems
(OrderID, ProductID, Quantity, UnitPrice)
VALUES
(1003, 104, 2, 55.00);

-- 1004 = missing customer reference + invalid quantity.
INSERT INTO dbo.Orders
(ExternalOrderNo, CustomerID, OrderDate, OrderStatus, OrderTotal)
VALUES
('WEB-1004', 999, GETDATE(), 'NEW', 0.00);

INSERT INTO dbo.OrderItems
(OrderID, ProductID, Quantity, UnitPrice)
VALUES
(1004, 103, 0, 180.00);

-- 1005 and 1006 intentionally share an external order number.
INSERT INTO dbo.Orders
(ExternalOrderNo, CustomerID, OrderDate, OrderStatus, OrderTotal)
VALUES
('WEB-DUP-01', 1, GETDATE(), 'NEW', 40.00),
('WEB-DUP-01', 1, GETDATE(), 'NEW', 40.00);

INSERT INTO dbo.OrderItems
(OrderID, ProductID, Quantity, UnitPrice)
VALUES
(1005, 104, 1, 40.00),
(1006, 104, 1, 40.00);
GO

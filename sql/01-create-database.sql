IF DB_ID('SalesOrderAPI_DB') IS NULL
BEGIN
    CREATE DATABASE SalesOrderAPI_DB;
END
GO

USE SalesOrderAPI_DB;
GO

IF OBJECT_ID('dbo.OrderItems', 'U') IS NOT NULL DROP TABLE dbo.OrderItems;
IF OBJECT_ID('dbo.Orders', 'U') IS NOT NULL DROP TABLE dbo.Orders;
IF OBJECT_ID('dbo.Products', 'U') IS NOT NULL DROP TABLE dbo.Products;
IF OBJECT_ID('dbo.Customers', 'U') IS NOT NULL DROP TABLE dbo.Customers;
GO

CREATE TABLE dbo.Customers (
    CustomerID INT PRIMARY KEY,
    CustomerName VARCHAR(100) NOT NULL,
    Email VARCHAR(150) NULL,
    Region VARCHAR(50) NULL
);

CREATE TABLE dbo.Products (
    ProductID INT PRIMARY KEY,
    ProductName VARCHAR(100) NOT NULL,
    Category VARCHAR(50) NOT NULL,
    ListPrice DECIMAL(12,2) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

-- No UNIQUE constraint on ExternalOrderNo intentionally.
-- This lets the demo database contain a duplicate for reconciliation testing.
CREATE TABLE dbo.Orders (
    OrderID INT IDENTITY(1001,1) PRIMARY KEY,
    ExternalOrderNo VARCHAR(50) NOT NULL,
    CustomerID INT NULL,
    OrderDate DATETIME2 NOT NULL DEFAULT GETDATE(),
    OrderStatus VARCHAR(30) NOT NULL,
    OrderTotal DECIMAL(12,2) NOT NULL
);

CREATE TABLE dbo.OrderItems (
    OrderItemID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(12,2) NOT NULL
);
GO

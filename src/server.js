require("dotenv").config();

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./swagger");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");

const healthRoutes = require("./routes/healthRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reconciliationRoutes = require("./routes/reconciliationRoutes");

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use("/api/health", healthRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reconciliation", reconciliationRoutes);

app.get("/api-docs.json", (req, res) => {
  res.json(swaggerSpec);
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    requestId: req.requestId,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `${req.method} ${req.originalUrl} does not exist.`
    }
  });
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
  console.log(`Swagger UI at http://localhost:${port}/api-docs`);
});

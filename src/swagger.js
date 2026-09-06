const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sales Order Reconciliation API",
      version: "1.0.0",
      description:
        "Interview demo API for CRUD, SQL validation, reconciliation, error handling, and discrepancy troubleshooting."
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Local development server"
      }
    ]
  },
  apis: ["./src/routes/*.js"]
};

module.exports = swaggerJsdoc(options);

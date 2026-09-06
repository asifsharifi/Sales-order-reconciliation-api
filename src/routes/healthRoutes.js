
const express = require("express");
const { queryDatabase } = require("../db");

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check API and SQL Server health
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API and DB are available
 *       503:
 *         description: Database is unavailable
 */
router.get("/", async (req, res) => {

    try {

        const result = await queryDatabase(
            `
            SELECT
                DB_NAME() AS DatabaseName,
                SUSER_SNAME() AS LoginName
            `
        );

        res.status(200).json({
            success: true,
            api: "UP",
            database: "UP",
            databaseName: result[0].DatabaseName,
            loginName: result[0].LoginName,
            timestamp: new Date().toISOString(),
            requestId: req.requestId
        });

    } catch (error) {

        console.error("DATABASE HEALTH CHECK FAILED");
        console.dir(error, { depth: null });

        res.status(503).json({
            success: false,
            api: "UP",
            database: "DOWN",
            message: "Database connection failed",
            requestId: req.requestId
        });
    }
});

module.exports = router;
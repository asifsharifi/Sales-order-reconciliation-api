


require("dotenv").config();

const sql = require("msnodesqlv8");

const connectionString =
    `Driver={ODBC Driver 18 for SQL Server};` +
    `Server=ASIF\\SQLEXPRESS;` +
    `Database=SalesOrderAPI_DB;` +
    `Trusted_Connection=Yes;` +
    `Encrypt=Yes;` +
    `TrustServerCertificate=Yes;`;

console.log("Testing SQL Server connection...");
console.log("Server: ASIF\\SQLEXPRESS");
console.log("Database: SalesOrderAPI_DB");

const query = `
    SELECT
        DB_NAME() AS DatabaseName,
        SUSER_SNAME() AS LoginName
`;

sql.query(connectionString, query, (err, rows) => {

    if (err) {
        console.log("\nSQL CONNECTION FAILED\n");

        console.dir(err, {
            depth: null
        });

        return;
    }

    console.log("\nSQL CONNECTION SUCCESSFUL\n");

    console.log(rows);
});
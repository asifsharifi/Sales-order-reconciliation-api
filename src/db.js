
const sql = require("msnodesqlv8");

const connectionString =
    `Driver={ODBC Driver 18 for SQL Server};` +
    `Server=ASIF\\SQLEXPRESS;` +
    `Database=SalesOrderAPI_DB;` +
    `Trusted_Connection=Yes;` +
    `Encrypt=Yes;` +
    `TrustServerCertificate=Yes;`;

function queryDatabase(query, params = []) {

    return new Promise((resolve, reject) => {

        sql.query(
            connectionString,
            query,
            params,
            (err, rows) => {

                if (err) {
                    console.error("SQL ERROR:");
                    console.dir(err, { depth: null });

                    reject(err);
                    return;
                }

                resolve(rows);
            }
        );
    });
}

module.exports = {
    queryDatabase
};
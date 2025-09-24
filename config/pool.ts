import mysql, { Pool, PoolOptions } from "mysql2/promise";
import dotenv from "dotenv";

import fs from "fs";
let pool: Pool;
if (fs.existsSync("./.env")) {
  dotenv.config({ path: "./.env" });
}
const poolConfig: PoolOptions = {
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

export default pool = mysql.createPool(poolConfig); // Create the pool

(async () => {
  try {
    await pool.getConnection();
    console.log("Connection Pool Created!");
  } catch (err) {
    console.log("Error occurred while creating pool");
  }
})();

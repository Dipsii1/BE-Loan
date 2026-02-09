const mysql = require("mysql2/promise");
const { drizzle } = require("drizzle-orm/mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function test() {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Database connected!");
  } catch (err) {
    console.error("❌ Database NOT connected:");
    console.error(err.message);
  }
}

test();

module.exports = { db };

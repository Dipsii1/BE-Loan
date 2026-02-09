require("dotenv").config();

/** @type { import("drizzle-kit").Config } */
module.exports = {
  schema: "./src/lib/schema/**/*.js",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};

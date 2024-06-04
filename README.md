# @tralse/mysql-middleware

This package provides a middleware for modularized and remodified modules on MYSQL database, providing a robust development.

## Key Features

- Deadlock management with exponential backoff
- Modular functions for database operations

## Installation

```bash
npm install @tralse/mysql-middleware express-session express
```

## Usage

```javascript
import { TralseMySQL, getMysql } from "@tralse/mysql-middleware";
import mysql from "mysql2/promise";
import session from "express-session";
import express from "express";

// Create a MySQL connection pool with the provided configuration
const pool = mysql.createPool({
  // Database connection details
  host: "localhost",
  user: "your_username",
  password: "your_password",
  database: "your_database",
  connectionLimit: 10,
});

// Create an Express application instance
const app = express();

// Configure the Express application to use the session middleware
app.use(
  session({
    secret: "your_secret_key", // Secret key used for signing session IDs
    resave: false, // Do not save the session on every request
    saveUninitialized: true, // Save uninitialized sessions
    cookie: { secure: false }, // Set the session cookie as non-secure (can be sent over HTTP)
  })
);

// Use the TralseMySQL middleware to handle MySQL connections and transactions
// NOTE: set it to true if you will perform transactions
app.use(TralseMySQL(pool, "sample", true));

// ******************************* //
// Can execute paramless query
// ******************************* //

app.get("/test/simple", async (req, res) => {
  // Get the necessary MySQL methods from the TralseMySQL middleware
  const { initializeConnection, query, releaseConnection } = getMysql(
    req,
    "sample"
  );

  try {
    // Acquire a connection from the pool
    await initializeConnection();

    // Execute a simple SELECT query
    const rows = await query("SELECT 1");

    // Send the query result back to the client
    res.send(rows);
  } catch (error) {
    // Handle any errors that occurred during the request
    res.status(500).json({ error: error.message });
  } finally {
    // Release the connection back to the pool
    await releaseConnection();
  }
});

// Use the TralseMySQL middleware to handle MySQL connections and transactions
app.use(TralseMySQL(pool, "sample", true));

// ******************************* //
// Can execute query with param
// ******************************* //

app.get("/test/param", async (req, res) => {
  // Get the necessary MySQL methods from the TralseMySQL middleware
  const { initializeConnection, query, releaseConnection } = getMysql(
    req,
    "sample"
  );

  try {
    // Acquire a connection from the pool
    await initializeConnection();

    // Execute a simple SELECT query
    const rows = await query("SELECT name from Users where id=?", [id]);

    // Send the query result back to the client
    res.send(rows);
  } catch (error) {
    // Handle any errors that occurred during the request
    res.status(500).json({ error: error.message });
  } finally {
    // Release the connection back to the pool
    await releaseConnection();
  }
});

// ******************************* //
// Can execute array of queries
// ******************************* //

app.get("/test/param", async (req, res) => {
  // Get the necessary MySQL methods from the TralseMySQL middleware
  const { initializeConnection, query, releaseConnection } = getMysql(
    req,
    "sample"
  );

  try {
    // Acquire a connection from the pool
    await initializeConnection();

    // Execute a simple SELECT query
    const [_, rows] = await query(
      [
        "INSERT INTO Users (name, id) VALUES (`John`, 1)",
        "SELECT name FROM Users WHERE id=?",
      ],
      [null, [id]]
    );

    // Send the query result back to the client
    res.send(rows);
  } catch (error) {
    // Handle any errors that occurred during the request
    res.status(500).json({ error: error.message });
  } finally {
    // Release the connection back to the pool
    await releaseConnection();
  }
});

// Define a route to handle payment processing
app.post("/pay", async (req, res) => {
  // Get the necessary MySQL methods from the TralseMySQL middleware
  const { initializeConnection, transaction } = getMysql(req, "sample");

  try {
    // Acquire a connection from the pool
    await initializeConnection();

    // Start a new transaction
    const { init } = await transaction();

    // Execute a query within the transaction
    await init(["SELECT 1"], [null]);

    // Send a success response to the client
    res.json({ message: "Transaction initialized successfully" });
  } catch (error) {
    // NOTE: automatically rolls back if init is unsuccess.
    // Handle any errors that occurred during the transaction
    res.status(500).json({ error: "Transaction failed: " + error.message });
  }
});

// Define a route to handle transaction confirmation
app.post("/confirm", async (req, res) => {
  // Get the necessary MySQL methods from the TralseMySQL middleware
  const { transaction, releaseConnection } = getMysql(req, "sample");

  try {
    // Get the commit method from the transaction object
    const { commit } = await transaction();

    // Commit the transaction
    await commit();

    // Send a success response to the client
    res.json({ message: "Transaction committed successfully" });
  } catch (error) {
    // NOTE: automatically rolls back if commit is unsuccess.
    // Handle any errors that occurred during the transaction
    res.status(500).json({ error: "Transaction failed: " + error.message });
  } finally {
    // Release the connection back to the pool
    await releaseConnection();
  }
});

// Define a route to handle transaction cancellation
app.post("/cancel", async (req, res) => {
  // Get the necessary MySQL methods from the TralseMySQL middleware
  const { transaction, releaseConnection } = getMysql(req, "sample");

  try {
    // Get the rollback method from the transaction object
    const { rollback } = await transaction();

    // Roll back the transaction
    await rollback();

    // Send a success response to the client
    res.json({ message: "Transaction rollback successfully" });
  } catch (error) {
    // Handle any errors that occurred during the transaction
    res.status(500).json({ error: "Transaction failed: " + error.message });
  } finally {
    // Release the connection back to the pool
    await releaseConnection();
  }
});

// Start the Express server on port 3000
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
```

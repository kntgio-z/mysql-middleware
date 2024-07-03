[> Back](./TRALSEMYSQL.md.md)

# `transaction` Method

**TABLE OF CONTENTS**

- [`transaction` Method](#transaction-method)
  - [query Method](#query-method)
  - [retrieve Callback](#retrieve-callback)
  - [commit Method](#commit-method)
    - [rollback Method](#rollback-method)

Begins a database transaction.

- **Returns**: A promise that resolves with the transaction methods needed for the transaction.
- **Throws**: `DatabaseError` - If there is an error initializing the transaction.

```javascript
app.post("/transact", async (req, res) => {
  const { initializeConnection, transaction } = getMySQL(req, "sample");

  try {
    // Acquire a connection from the pool
    await initializeConnection();

    // Start a new transaction
    const { init, query, commit, rollback } = await transaction();

    // Your transaction-related code here
  } catch (error) {
    // Handle any errors that occurred during the request
    res.status(500).json({ error: error.message });
  }
});
```

## query Method

Performs a transaction query.

- **Param** `sql`: The SQL query or an array of SQL queries to execute.
- **Param** `params`: The parameters for the SQL query or an array of parameters for multiple queries.
- **Param** `options`: Optional settings for configuring query execution behavior.
- **Returns**: A promise that resolves with the result of the SQL query or an array of results for multiple queries.
- **Throws**:
  - `DatabaseError` - If there is a mismatch between SQL queries and parameters or any other error occurs during execution.
  - `TransactionError` - If the transaction initialization fails.

```javascript
app.post("/pay", async (req, res) => {
  const { initializeConnection, transaction } = getMySQL(req, "sample");

  try {
    // Acquire a connection from the pool
    await initializeConnection();

    // Start a new transaction
    const { init, query, rollback } = await transaction();

    // Execute a method which initializes the transaction.
    await init();

    // Execute a query within the transaction
    await query("SELECT 1");

    // Send a success response to the client
    res.json({ message: "Transaction executed successfully" });
  } catch (error) {
    await rollback();
    // Handle any errors that occurred during the transaction
    res.status(500).json({ error: "Transaction failed: " + error.message });
  }
});
```

## retrieve Callback

Built-in method to retrieve transaction information.

One of the returned objects of the transaction method is the `retrieve` callback, which returns information about the current transaction.

This callback returns an object.

```typescript
{
    connection: boolean,
    referenceNo?: string | undefined | null,
    timestamp?: string | undefined | null,
}
```

- `connection` - Indicates if a connection is initialized or not
- `referenceNo` - Reference number based on the **latest query**
- `timestamp` - Timestamp where the **latest query is executed**

```javascript
Copy code
app.post("/pay", async (req, res) => {
const { initializeConnection, transaction } = getMySQL(req, "sample");

try {
// Acquire a connection from the pool
await initializeConnection();

    // Start a new transaction
    const { init, query, retrieve, rollback } = await transaction();

    // Execute a method which initializes the transaction.
    await init();

    // Execute a query within the transaction
    await query("SELECT 1");

    const { connection, referenceNo, timestamp } = retrieve();

    // Send a success response to the client
    res.json({
      message: "Transaction executed successfully",
      isDbconnectionInitialized: connection,
      referenceNo,
      timestamp,
    });

} catch (error) {
await rollback();
// Handle any errors that occurred during the transaction
res.status(500).json({ error: "Transaction failed: " + error.message });
}
});
```

## commit Method

Commits the current transaction.

- **Returns**: A promise that resolves when the transaction is committed.
- **Throws**: TransactionError - If the transaction commit fails.

```javascript
app.post("/pay", async (req, res) => {
  const { initializeConnection, transaction } = getMySQL(req, "sample");

  try {
    // Acquire a connection from the pool
    await initializeConnection();

    // Start a new transaction
    const { init, query, rollback } = await transaction();

    // Execute a method which initializes the transaction.
    await init();

    // Execute a query within the transaction
    await query("SELECT 1");

    // Commit the transaction
    await commit();

    // Send a success response to the client
    res.json({ message: "Transaction executed successfully" });
  } catch (error) {
    await rollback();
    // Handle any errors that occurred during the transaction
    res.status(500).json({ error: "Transaction failed: " + error.message });
  }
});
```

### rollback Method

Rolls back the current transaction.

- **Returns**: A promise that resolves when the transaction is rolled back.
- **Throws**: `TransactionError` - If the transaction rollback fails.

```javascript
app.post("/pay", async (req, res) => {
  const { initializeConnection, transaction } = getMySQL(req, "sample");

  try {
    // Acquire a connection from the pool
    await initializeConnection();

    // Start a new transaction
    const { init, query, rollback } = await transaction();

    // Execute a method which initializes the transaction.
    await init();

    // Execute a query within the transaction
    await query("SELECT 1");

    // Rollback the transaction
    await rollback();

    // Send a failure response to the client
    res.status(500).json({ message: "Transaction rolled back" });
  } catch (error) {
    // Handle any errors that occurred during the transaction
    res.status(500).json({ error: "Transaction failed: " + error.message });
  }
});
```

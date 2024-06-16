[> Back](./TRALSEMYSQL.md)

# transaction Method

Begins a database transaction.

- **Returns**: A promise that resolves with the transaction methods It returns the methods needed fot the transaction.
- **Throws**: `DatabaseError` - If there is an error initializing the transaction.

```javascript
app.post("/transact", async (req, res) => {
  const { initializeConnection, transaction } = getMysql(req, "sample");

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
- **Returns**: A promise that resolves with the result of the SQL query or an array of results for multiple queries.
- **Throws**:
  - `DatabaseError` - If there is a mismatch between SQL queries and parameters or any other error occurs during execution.
  - `TransactionError` - If the transaction initialization fails.

```javascript
app.post("/pay", async (req, res) => {
  const { initializeConnection, transaction } = getMysql(req, "sample");

  try {
    // Acquire a connection from the pool
    await initializeConnection();

    // Start a new transaction
    const { init, query, rollback } = await transaction();

    // Execute a method which initializes the transaction.
    await init();

    // Execute a query within the transaction
    await query("SELECT 1", [null]);

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

One of the returned objects of the transaction method is the `retrieve` callback, which returns all the informations made by a transaction.

This callback returns an object.

- If the retrive is success

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

- If the retrieve is not success, it throws an `Error`.

Example implementation

```javascript
app.post("/pay", async (req, res) => {
  const { initializeConnection, transaction } = getMysql(req, "sample");

  try {
    // Acquire a connection from the pool
    await initializeConnection();

    // Start a new transaction
    const { init, query, retrieve, rollback } = await transaction();

    // Execute a method which initializez the transaction.
    await init();

    // Execute a query within the transaction
    await query("SELECT 1", [null]);

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

**NOTE**: retrieve result data depends on the last executed query. Therefore, their values differs.

```javascript
app.post("/pay", async (req, res) => {
  const { initializeConnection, transaction } = getMysql(req, "sample");

  try {
    // Acquire a connection from the pool
    await initializeConnection();

    // Start a new transaction
    const { init, query, retrieve, rollback } = await transaction();

    // Execute a method which initializez the transaction.
    await init();

    // Query 1
    await query("SELECT 1");

    // Query 1 details
    const queryres1 = retrieve();

    // Query 2
    await query("SELECT 2");

    // Query 2 details
    const queryres2 = retrieve();

    // Query 3
    await query("SELECT 3");

    // Query 3 details
    const queryres3 = retrieve();

    // Send a success response to the client
    res.json({
      message: "Transaction executed successfully",
      results: [queryres1, queryres2, queryres3],
    });
  } catch (error) {
    await rollback();
    // Handle any errors that occurred during the transaction
    res.status(500).json({ error: "Transaction failed: " + error.message });
  }
});
```

Here is another example. the retrieve details is referenced on the query that is in the bottom.

```javascript
app.post("/pay", async (req, res) => {
  const { initializeConnection, transaction } = getMysql(req, "sample");

  try {
    // Acquire a connection from the pool
    await initializeConnection();

    // Start a new transaction
    const { init, query, retrieve, rollback } = await transaction();

    // Execute a method which initializez the transaction.
    await init();

    // Query 1
    await query("SELECT 1");
    // Query 2
    await query("SELECT 2");
    // Query 3
    await query("SELECT 3");

    // Details are based on the last query, which is query 3.
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

Commits the current transaction, based on saved transaction on session.

- **returns** A promise that resolves when the transaction is committed.
- **throws** `TransactionError` - If the transaction commit fails.

```javascript
app.post("/confirm", async (req, res) => {
  const { transaction, releaseConnection } = getMysql(req, "sample");

  try {
    // You observed that the transaction is not initialized. It is because the transaction is recorded and ready to be retrieve anytime.
    // This automatically retrieves the pending transaction.
    // I the pending transaction go stale, it will be automatically deleted within minutes.
    // Get the commit method from the transaction object
    const { commit, rollback } = await transaction();

    // Commit the transaction
    await commit();

    // Send a success response to the client
    res.json({ message: "Transaction committed successfully" });
  } catch (error) {
    await rollback();
    // Handle any errors that occurred during the transaction
    res.status(500).json({ error: "Transaction failed: " + error.message });
  } finally {
    // Release the connection back to the pool
    await releaseConnection();
  }
});
```

## rollback Method

Rolls back the current transaction, based on saved transaction on session.

- **returns** A promise that resolves when the transaction is committed.
- **throws** `TransactionError` - If the transaction rollback fails.

```javascript
app.post("/cancel", async (req, res) => {
  const { transaction, releaseConnection } = getMysql(req, "sample");

  try {
    // You observed that the transaction is not initialized. It is because the transaction is recorded and ready to be retrieve anytime.
    // This automatically retrieves the pending transaction.
    // I the pending transaction go stale, it will be automatically deleted within minutes.
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

## Single-Endpoint Transaction

As you can see in the previous examples, each operation has its corresponding endpoints. But is it possible to do it all in one endpoint? Definitely. Here is an exampke on how to do transaction on a single endoint.

```javascript
app.post("/pay", async (req, res) => {
  const { initializeConnection, transaction } = getMysql(req, "sample");

  try {
    // Acquire a connection from the pool
    await initializeConnection();

    // Start a new transaction
    const { init, query, generateRefNo, commit, rollback } =
      await transaction();

    // Execute a method which initializez the transaction.
    await init();

    // Execute a query within the transaction
    await query("SELECT 1", [null]);

    await commit();
    // Send a success response to the client
    res.json({
      message: "Transaction executed successfully",
      ref: generateRefNo(),
    });
  } catch (error) {
    await rollback();
    // Handle any errors that occurred during the transaction
    res.status(500).json({ error: "Transaction failed: " + error.message });
  }
});
```

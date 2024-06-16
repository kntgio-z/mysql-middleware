[> Back](./TRALSEMYSQL.md)

# transaction Method

Begins a database transaction.

- **Param** `isolationLevel`: The isolation level for the transaction. Defaults to "READ COMMITTED". Currently non-functional; leave blank.
- **Returns**: A promise that resolves with the transaction methods.
- **Throws**: `DatabaseError` - If there is an error initializing the transaction.

```javascript
app.post("/transact", async (req, res) => {
  const { initializeConnection, transaction } = getMysql(req, "sample");

  try {
    // Acquire a connection from the pool
    await initializeConnection();

    // Start a new transaction
    const { init, commit, rollback } = await transaction();

    // Your transaction-related code here
  } catch (error) {
    // Handle any errors that occurred during the request
    res.status(500).json({ error: error.message });
  }
});
```

## init Method

Initializes a transaction, executes the provided SQL queries with parameters, and generates a reference number.

- **Param** `sql`: The SQL query or an array of SQL queries to execute.
- **Param** `params`: The parameters for the SQL query or an array of parameters for multiple queries.
- **Param** `generateReferenceNo`: A function to generate a reference number for the transaction. NOTE: Leaving this blank will use the built-in reference number maker.
- **Returns**: A promise that resolves with the result of the SQL query or an array of results for multiple queries.
- **Throws**:
  - `DatabaseError` - If there is a mismatch between SQL queries and parameters or any other error occurs during execution.
  - `TransactionError` - If the transaction initialization fails.

```javascript
const generateRefNo = () => {
  // Generation of ref no, must return a string.
};

app.post("/pay", async (req, res) => {
  const { initializeConnection, transaction } = getMysql(req, "sample");

  try {
    // Acquire a connection from the pool
    await initializeConnection();

    // Start a new transaction
    const { init } = await transaction();

    // Execute a query within the transaction
    await init(["SELECT 1"], [null], generateRefNo);

    // or if you want to use the built-in reference number maker
    //await init(["SELECT 1"], [null]);

    // Send a success response to the client
    res.json({ message: "Transaction initialized successfully" });
  } catch (error) {
    // NOTE: automatically rolls back if init is unsuccess.
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
```

## rollback Method

Rolls back the current transaction, based on saved transaction on session.

- **returns** A promise that resolves when the transaction is committed.
- **throws** `TransactionError` - If the transaction rollback fails.

```javascript
app.post("/cancel", async (req, res) => {
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

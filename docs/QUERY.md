[> Back](./TRALSEMYSQL.md)

# query Method

The `query` method allows you to execute a database query. There are different ways to implement the `query` method.

**NOTE**: You do not need to destructure the result, as it already returns the first element of the array from `sql.query`.

## Plain Query

You can execute a simple query using the `query` method.

```javascript
app.get("/test", async (req, res) => {
  const { initializeConnection, query, releaseConnection } = getMysql(
    req,
    "sample"
  );

  try {
    // Acquire a connection from the pool
    await initializeConnection();

    // Execute a simple SELECT query
    const rows = await query("SELECT * FROM Users");

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
```

## Parameterized Query

You can also execute parameterized queries to prevent SQL injection and handle dynamic data.

```javascript
app.get("/test/param", async (req, res) => {
  const { initializeConnection, query, releaseConnection } = getMysql(
    req,
    "sample"
  );

  try {
    const { id } = req.query;

    // Acquire a connection from the pool
    await initializeConnection();

    // Execute a parametized SELECT query
    const rows = await query("SELECT * FROM Users WHERE id=?", [id]);

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
```

## Array of Parameterized Queries

You can execute an array of parameterized queries for batch operations.

```javascript
app.get("/test/param/arr", async (req, res) => {
  const { initializeConnection, query, releaseConnection } = getMysql(
    req,
    "sample"
  );

  try {
    const { id } = req.query;

    // Acquire a connection from the pool
    await initializeConnection();

    // Execute an array of parametized SELECT query
    readme;
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
```

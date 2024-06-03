import { DatabaseError } from "../errors/error";
import { DatabaseObject } from "../types";

const TIMEOUT_WITHIN = 60000;

// Map to manage database connections
const connectionManager = new Map<string, DatabaseObject>();

/**
 * Sets the connection ID in the request session.
 *
 * @param req - The request object.
 * @param id - The connection ID to set.
 */
const setConnectionId = (req: any, id: string): void => {
  req.session.tralse_db_mysql = {
    ...req.session.tralse_db_mysql,
    connectionId: id,
  };
};

/**
 * Gets the connection ID from the request session.
 *
 * @param req - The request object.
 * @returns The connection ID.
 * @throws DatabaseError - If the connection is not initialized.
 */
const getConnectionId = (req: any): string => {
  if (
    !req.session.tralse_db_mysql ||
    !req.session.tralse_db_mysql.connectionId
  ) {
    throw new DatabaseError("Connection is not yet initialized.");
  }
  return req.session.tralse_db_mysql.connectionId;
};

/**
 * Serializes a database connection into the session and manager.
 *
 * @param req - The request object.
 * @param connection - The MySQL connection to serialize.
 */
export const serializeConnection = (req: any, connection: Connection): void => {
  // Obtain the connection ID from the threadId of the connection
  const connectionId = connection.threadId.toString();
  // Set the connection ID in the request session
  setConnectionId(req, connectionId);
  // Store the connection in the connectionManager with its ID as key
  const connectionData: DatabaseObject & { timeoutId?: NodeJS.Timeout } = {
    connection,
  };
  connectionManager.set(connectionId, connectionData);

  // Set up timeout to delete connection if not settled within 1 minute
  const timeoutId = setTimeout(() => {
    connectionManager.delete(connectionId);
    clearTimeout(timeoutId);
  }, TIMEOUT_WITHIN);
  connectionData.timeoutId = timeoutId;
};

/**
 * Deserializes the connection from the session and manager.
 *
 * @param req - The request object.
 * @returns The deserialized connection data.
 * @throws DatabaseError - If the connection key is not found.
 */
export const deserializeConnection = (
  req: any
): { id: string; data: DatabaseObject & { timeoutId?: NodeJS.Timeout } } => {
  // Obtain the connection ID from the request session
  const connectionId = getConnectionId(req);
  // Check if the connection ID exists in the connectionManager
  if (connectionManager.has(connectionId)) {
    // If found, return the connection ID and its data
    return { id: connectionId, data: connectionManager.get(connectionId)! };
  } else {
    // If not found, throw an error
    throw new DatabaseError("Connection key not found.");
  }
};

/**
 * Retrieves the database object from the request.
 *
 * @param req - The request object.
 * @returns The retrieved database object.
 */
export const getDbObject = (req: any): DatabaseObject => {
  // Deserialize the connection data from the request
  const { data } = deserializeConnection(req);
  // Return the database object
  return data;
};

/**
 * Updates the database object in the manager.
 *
 * @param req - The request object.
 * @param updateData - The new properties to update.
 */
export const updateDbObject = (
  req: any,
  updateData: Partial<DatabaseObject>
): void => {
  // Deserialize the connection data from the request
  const { id, data } = deserializeConnection(req);
  // Update the database object in the connectionManager
  connectionManager.set(id, { ...data, ...updateData });
};

/**
 * Removes the database object from the manager.
 *
 * @param req - The request object.
 * @throws DatabaseError - If the database object is not found.
 */
export const dispatchDbObject = (req: any): void => {
  // Deserialize the connection data from the request
  const { id } = deserializeConnection(req);
  // Remove the database object from the connectionManager
  const connectionData = connectionManager.get(id);
  if (connectionData?.timeoutId) {
    clearTimeout(connectionData.timeoutId);
  }
  connectionManager.delete(id);
};

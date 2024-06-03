import { DatabaseError } from "../errors/error";
import { DatabaseObject } from "../types";
import { TralseRequest } from "../types";
import { PoolConnection as Connection } from "mysql2/promise";

const TIMEOUT_WITHIN = 60000;

// Map to manage database connections
const connectionManager = new Map<string, DatabaseObject>();

/**
 * Checks if the session object is initialized in the request.
 *
 * @param req - The request object.
 * @throws DatabaseError - If the session object is not yet initialized.
 */
const checkSessionObject = (req: TralseRequest): void => {
  console.log("In checkSessionObject, checking session");
  if (!req.session)
    throw new DatabaseError(
      "Session object is not yet initialized. Make sure that you have configured your session."
    );
    console.log("Session exists");
    
};

/**
 * Sets the connection ID in the request session.
 *
 * @param req - The request object.
 * @param id - The connection ID to set.
 * @throws DatabaseError - If there is an error setting the connection ID.
 */
const setConnectionId = (req: TralseRequest, id: string): void => {
  try {
    console.log("Setting connection id");
    
    checkSessionObject(req);
    req.session.tralse_db_mysql = {
      connectionId: id,
    };

    console.log("Connection set. tralse_db_mysql initialized in session.");
    
  } catch (error: any) {
    throw new DatabaseError(error.message);
  }
};

/**
 * Gets the connection ID from the request session.
 *
 * @param req - The request object.
 * @returns The connection ID.
 * @throws DatabaseError - If the connection is not initialized or there is an error getting the connection ID.
 */
const getConnectionId = (req: TralseRequest): string => {
  try {
    console.log("Getting connection id");
    
    if (
      !req.session.tralse_db_mysql ||
      !req.session.tralse_db_mysql.connectionId
    ) {
      throw new DatabaseError("Connection is not yet initialized.");
    }
    console.log("Connection fetched");
    return req.session.tralse_db_mysql.connectionId;
  } catch (error: any) {
    throw new DatabaseError(error.message);
  }
};

/**
 * Serializes a database connection into the session and manager.
 *
 * @param req - The request object.
 * @param connection - The MySQL connection to serialize.
 */
export const serializeConnection = (
  req: TralseRequest,
  connection: Connection
): void => {
  console.log("Serializing connection");
  
  // Obtain the connection ID from the threadId of the connection
  const connectionId = connection.threadId.toString();
  // Set the connection ID in the request session
  setConnectionId(req, connectionId);
  // Store the connection in the connectionManager with its ID as key
  const connectionData: DatabaseObject = {
    connection,
  };
  connectionManager.set(connectionId, connectionData);
  console.log("Set into connectionManager, setting timeout id");
  
  // Set up timeout to delete connection if not settled within 1 minute
  const timeoutId = setTimeout(() => {
    connectionManager.delete(connectionId);
    clearTimeout(timeoutId);
    console.log("Stale connection deleted.");
    
  }, TIMEOUT_WITHIN);
  connectionData.timeoutId = timeoutId.toString();
  console.log("timeout id set.");
  
};

/**
 * Deserializes the connection from the session and manager.
 *
 * @param req - The request object.
 * @returns The deserialized connection data.
 * @throws DatabaseError - If the connection key is not found.
 */
export const deserializeConnection = (
  req: TralseRequest
): { id: string; data: DatabaseObject } => {
  console.log("Deserializing connection");
  
  // Obtain the connection ID from the request session
  const connectionId = getConnectionId(req);
  // Check if the connection ID exists in the connectionManager
  if (connectionManager.has(connectionId)) {
    console.log("Serialized");
    
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
export const getDbObject = (req: TralseRequest): DatabaseObject => {
  // Deserialize the connection data from the request
  const { data } = deserializeConnection(req);
  // Return the database object
  console.log("Inside getDbObject");
  
  return data;
};

/**
 * Updates the database object in the manager.
 *
 * @param req - The request object.
 * @param updateData - The new properties to update.
 */
export const updateDbObject = (
  req: TralseRequest,
  updateData: Partial<DatabaseObject>
): void => {
  console.log("Inside updateDbObject");
  // Deserialize the connection data from the request
  const { id, data } = deserializeConnection(req);
  // Update the database object in the connectionManager
  connectionManager.set(id, { ...data, ...updateData });
  console.log("updateDbObject updated");
};

/**
 * Removes the database object from the manager.
 *
 * @param req - The request object.
 * @throws DatabaseError - If the database object is not found.
 */
export const dispatchDbObject = (req: TralseRequest): void => {
  // Deserialize the connection data from the request
  console.log("Inside dispatchDbObject");
  const { id } = deserializeConnection(req);
  // Remove the database object from the connectionManager
  const connectionData = connectionManager.get(id);
  if (connectionData?.timeoutId) {
    clearTimeout(connectionData.timeoutId);
    console.log("Timeout cleared.");
    
  }
  connectionManager.delete(id);
  console.log("Deleted in connectionManager");
  
};

import moment from "moment-timezone";
import { v4 as uuidv4 } from "uuid";
/**
 * Gets the system's default timezone.
 *
 * @returns {string} The system's default timezone.
 */
const getSystemTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Generates the current timestamp formatted as 'YYYYMMDDHHmmss' in the system's default timezone.
 *
 * @returns {string} The current timestamp in the system's default timezone.
 */
const getSystemTimeStampNow = (): string => {
  const systemTimezone = getSystemTimezone();
  return moment().tz(systemTimezone).format("YYYYMMDDHHmmss");
};

/**
 * Generates a reference number by concatenating a UUID and the current timestamp in the system's default timezone.
 *
 * @returns {string} The generated reference number combining a UUID and the current timestamp.
 */
export const generateRefNo = (): string => {
  const timestamp: string = getSystemTimeStampNow();
  const uuid: string = uuidv4();
  return `${uuid}-${timestamp}`;
};

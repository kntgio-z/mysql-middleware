import dotenv from "dotenv";

dotenv.config();

const conditional = (message: string): void => {
  if (process.env.NODE_ENV !== "production") {
    console.log(message);
  }
};

// ANSI escape codes for colors
const colors = {
  blue: "\x1b[34m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  reset: "\x1b[0m",
};

const formatMessage = (
  color: string,
  message: string,
  header: string
): string => {
  return `${color}[${header}] ${message}${colors.reset}`;
};

const blue = (message: string, header: string = "tralseDb"): void => {
  conditional(formatMessage(colors.blue, message, header));
};

const green = (message: string, header: string = "tralseDb"): void => {
  conditional(formatMessage(colors.green, message, header));
};

const red = (message: string, header: string = "tralseDb"): void => {
  conditional(formatMessage(colors.red, message, header));
};

const magenta = (message: string, header: string = "tralseDb"): void => {
  conditional(formatMessage(colors.magenta, message, header));
};

export const log = { blue, green, red, magenta };

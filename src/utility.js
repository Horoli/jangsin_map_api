const Crypto = require("crypto");

class Utility {
  static UUID(dashless = false) {
    let uuid = Crypto.randomUUID();
    if (dashless) uuid = uuid.replace(/-/g, "");
    return uuid;
  }

  static ERROR(url, message, statusCode) {
    const error = new Error(`${url} error : [${message}]`);
    error.status = statusCode;
    return error;
  }
}

module.exports = Utility;

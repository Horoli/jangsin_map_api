const Crypto = require("crypto");

class Utility {
  static UUID(dashless = false) {
    let uuid = Crypto.randomUUID();
    if (dashless) uuid = uuid.replace(/-/g, "");
    return uuid;
  }

  static ERROR(url, message, statusCode) {
    const error = new Error(`${url} error : ${message}`);
    error.status = statusCode;
    return error;
  }

  static NAVER_CLIENT_HEADER = {
    "X-NCP-APIGW-API-KEY-ID": "rey7y37ny0",
    "X-NCP-APIGW-API-KEY": "N4o8cTaxOdHOYAydx7MjpOxwVH3oVMOzkmCiAt8g",
  };

  static TOKEN_EXPIRE_TIME = (1 * 30 * 60 * 1000);
}

module.exports = Utility;

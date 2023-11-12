const MongoDB = require("../mongodb");
const Utility = require("../utility");
const Crypto = require("crypto");

module.exports = {
  "GET /visitor": {
    async handler(req, res) {
      const visitorCol = await MongoDB.getCollection("visitorCount");
      const count = await visitorCol.count();
      return {
        statusCode: 200,
        message: `전체 방문자 수 : ${count}`,
      };
    },
  },

  "GET /visitor_update": {
    middlewares: ["app"],
    async handler(req, res) {
      const visitorCol = await MongoDB.getCollection("visitorCount");
      /*

      ip를 hash해서 저장 후, 방문자 관련 정보를 저장

      */

      const hash = Crypto.createHash("sha256").update(req.ip);
      const hashedIp = hash.digest("hex");

      const ipFindResult = await visitorCol.findOne({
        ip: hashedIp,
        visited_at: {
          $gte: Date.now() - 1000 * 60 * 60 * 24,
        },
      });

      if (ipFindResult === null) {
        await visitorCol.insertOne({ ip: hashedIp, visited_at: Date.now() });
      }
      return {
        statusCode: 200,
        message: "visitor update",
      };
    },
  },
};

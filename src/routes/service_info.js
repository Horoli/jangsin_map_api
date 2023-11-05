const MongoDB = require("../mongodb");
const Utility = require("../utility");

module.exports = {
  "GET /visitor": {
    async handler(req, res) {
      const visitorCol = await MongoDB.getCollection("visitorCount");

      const count = await visitorCol.count();

      return {
        statusCode: 200,
        data: count,
      };
    },
  },
};

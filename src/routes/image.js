const Utility = require("@Utility/utility");
const MongoDB = require("@Utility/mongodb");

module.exports = {
  "POST /thumbnail": {
    middlewares: ["app"],
    async handler(req, res) {
      const { thumbnail } = req.body;

      if (thumbnail === "" || thumbnail === undefined) {
        return Utility.ERROR(req.raw.url, "thumbnail_id is empty", 400);
      }
      const imageCol = await MongoDB.getCollection("image");

      const getThumbnail = await imageCol.findOne({ id: thumbnail });

      return {
        statusCode: 200,
        message: `${new Date().toLocaleString()} [image] get complete`,
        data: {
          thumbnail: getThumbnail,
        },
      };
    },
  },
  "POST /thumbnail_admin": {
    middlewares: ["auth"],
    async handler(req, res) {
      const { thumbnail } = req.body;

      if (thumbnail === "" || thumbnail === undefined) {
        return Utility.ERROR(req.raw.url, "thumbnail_id is empty", 400);
      }

      const imageCol = await MongoDB.getCollection("image");

      const getThumbnail = await imageCol.findOne({ id: thumbnail });

      return {
        statusCode: 200,
        message: `${new Date().toLocaleString()} [image] get complete`,
        data: {
          thumbnail: getThumbnail,
        },
      };
    },
  },
};

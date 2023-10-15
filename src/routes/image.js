const MongoDB = require("../mongodb");
const Utility = require("../utility");

module.exports = {
  "POST /thumbnail": {
    middlewares: ["app"],
    async handler(req, res) {
      const { thumbnail_id } = req.body;

      if (thumbnail_id === "" || thumbnail_id === undefined) {
        return Utility.ERROR(req.raw.url, "thumbnail_id is empty", 400);
      }

      const imageCol = await MongoDB.getCollection("image");

      console.log(thumbnail_id);

      const getThumbnail = await imageCol.findOne({ id: thumbnail_id });

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
      const { thumbnail_id } = req.body;

      if (thumbnail_id === "" || thumbnail_id === undefined) {
        return Utility.ERROR(req.raw.url, "thumbnail_id is empty", 400);
      }

      const imageCol = await MongoDB.getCollection("image");

      console.log(thumbnail_id);

      const getThumbnail = await imageCol.findOne({ id: thumbnail_id });

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

const Path = require("path");
const Fs = require("fs");
const MongoDB = require("../mongodb");
const Bcrypt = require("bcrypt");
const Utility = require("../utility");

module.exports = {
  "POST /sign_up": {
    middleware: ["app"],
    async handler(req, res) {
      const { id, pw, type } = req.body;

      const usersCol = await MongoDB.getCollection("users");
      const isDuplicate = (await usersCol.findOne({ id: id })) === null;
      if (!isDuplicate) {
        return Utility.ERROR(req.raw.url, "duplicated id", 403);
      }

      if (type === undefined) {
        return Utility.ERROR(req.raw.url, "please type select", 403);
      }

      const hashedPassword = await Bcrypt.hash(pw, 10);
      usersCol.insertOne({ id: id, pw: hashedPassword, type: type });

      return {
        statusCode: 200,
        message: `${new Date().toLocaleString()} [${id}] sign_up complete`,
      };
    },
  },

  "POST /sign_in": {
    async handler(req, res) {
      const { id, pw } = req.body;

      const usersCol = await MongoDB.getCollection("users");
      const tokensCol = await MongoDB.getCollection("tokens");

      const userInfo = await usersCol.findOne({ id: id });

      if (userInfo === null) {
        return Utility.ERROR(req.raw.url, "id is not exist", 403);
      }

      const isValidPassword = await Bcrypt.compare(pw, userInfo.pw);

      if (!isValidPassword) {
        return Utility.ERROR(req.raw.url, "invalid password", 403);
      }

      const getTokensById = await tokensCol.find({ id: id }).toArray();
      if (getTokensById.length > 0) {
        for (const inToken in getTokensById) {
          await tokensCol.deleteOne({ id: id });
        }
      }

      const token = Utility.UUID();
      await tokensCol.insertOne({
        id: id,
        token: token,
        expireAt: Date.now() + 1 * 30 * 60 * 1000,
      });

      return {
        statusCode: 200,
        message: `${new Date().toLocaleString()} [${id}] sign_in complete`,
        data: { token: token },
      };
    },
  },
};

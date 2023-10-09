const Path = require("path");
const Fs = require("fs");
const MongoDB = require("../mongodb");
const Bcrypt = require("bcrypt");
const Utility = require("../utility");

module.exports = {
  "POST /sign_up": {
    async handler(req, res) {
      const { id, pw, type } = req.body;

      const usersCol = await MongoDB.getCollection("users");
      const isDuplicate = (await usersCol.findOne({ id: id })) === null;
      if (!isDuplicate) {
        const error = new Error();
        error.message = "Error : duplicated id";
        return error;
      }

      if (type === undefined) {
        const error = new Error();
        error.message = "Error : please type select.";
        return error;
      }

      const hashedPassword = await Bcrypt.hash(pw, 10);
      usersCol.insertOne({ id: id, pw: hashedPassword, type: type });

      return {
        status: 200,
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
        const error = new Error();
        error.message = "id is not exist.";
        return error;
      }

      const isValidPassword = await Bcrypt.compare(pw, userInfo.pw);

      if (!isValidPassword) {
        const error = new Error();
        error.message = "invalid password";
        return error;
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
        status: 200,
        message: `${new Date().toLocaleString()} [${id}] sign_in complete`,
        data: { token: token },
      };
    },
  },
};

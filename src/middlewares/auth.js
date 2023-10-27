const MongoDB = require("../mongodb");
const Utility = require("../utility");

module.exports = async (req, rep) => {
  const { token } = req.headers;

  const tokensCol = await MongoDB.getCollection("tokens");
  const usersCol = await MongoDB.getCollection("users");

  if (!token) {
    return Utility.ERROR("token", "Not permitted(please input token)", 503);
  }

  const tokenInfo = await tokensCol.findOne({ token: token });
  if (tokenInfo === undefined) {
    return Utility.ERROR(
      "token",
      "Not permitted(tokenInfo is undefined.)",
      503
    );
  } else if (Date.now() - tokenInfo.expireAt > 0) {
    await tokensCol.deleteOne({ token: token });
    return Utility.ERROR("token", "token Expired", 503);
  }

  tokenInfo.expireAt = Date.now() + 1 * 30 * 6 * 1000;
  // tokenInfo.expireAt = Date.now() + 1;

  req.token = tokenInfo;
  req.user = await usersCol.findOne({ id: tokenInfo.id });
};

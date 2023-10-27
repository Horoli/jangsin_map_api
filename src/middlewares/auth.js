const MongoDB = require("../mongodb");
const Utility = require("../utility");

module.exports = async (req, rep) => {
  const { token } = req.headers;

  const tokensCol = await MongoDB.getCollection("tokens");
  const usersCol = await MongoDB.getCollection("users");

  if (!token) {
    return Utility.ERROR("token", "Not permitted(please input token)", 403);
  }



  const tokenInfo = await tokensCol.findOne({ token: token });
  console.log('tokenInfo', tokenInfo)
  if (tokenInfo === undefined || tokenInfo === null) {

    return Utility.ERROR(
      "token",
      "Not permitted(tokenInfo is undefined.)",
      403
    );
  } else if (Date.now() - tokenInfo.expireAt > 0) {
    await tokensCol.deleteOne({ token: token });
    return Utility.ERROR("token", "token Expired", 403);
  }

  tokenInfo.expireAt = Date.now() + Utility.TOKEN_EXPIRE_TIME;
  // tokenInfo.expireAt = Date.now();

  req.token = tokenInfo;
  req.user = await usersCol.findOne({ id: tokenInfo.id });
};

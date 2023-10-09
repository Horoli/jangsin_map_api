const MongoDB = require("../mongodb");

module.exports = async (req, rep) => {
  const { token } = req.headers;

  const tokensCol = await MongoDB.getCollection("tokens");
  const usersCol = await MongoDB.getCollection("users");

  if (!token) {
    const error = new Error("Error : Not permitted(please input token)");
    error.status = 403;
    return error;
  }

  const tokenInfo = await tokensCol.findOne({ token: token });
  if (tokenInfo === undefined) {
    const error = new Error("Error : Not permitted(tokenInfo is undefined.)");
    error.status = 403;
    return error;
  } else if (Date.now() - tokenInfo.expireAt > 0) {
    await tokensCol.deleteOne({ token: token });
    const error = new Error("Error : token Expired");
    error.status = 403;
    return error;
  }

  tokenInfo.expireAt = Date.now() + 1 * 30 * 6 * 1000;

  req.token = tokenInfo;
  req.user = await usersCol.findOne({ id: tokenInfo.id });
};

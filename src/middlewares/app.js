const MongoDB = require("../mongodb");
const Bcrypt = require("bcrypt");
const Utility = require("../utility");

module.exports = async (req, rep) => {
  const client_key = req.headers["client-key"];
  // console.log(req.headers);

  console.log('client-key', client_key);
  if (client_key === undefined) {
    return Utility.ERROR("client auth", "client-key is empty", 403);
  }

  const appInfoCol = await MongoDB.getCollection("appInfo");
  const getAppInfo = await appInfoCol.findOne({ label: "jangsin" });
  // console.log('getAppInfo', getAppInfo);

  // TODO : must delete
  if (getAppInfo === null) {
    const setInfo = await Bcrypt.hash("jang-sin", 10);
    await appInfoCol.insertOne({
      label: "jangsin",
      info: setInfo,
    });
  }

  const getInfo = await appInfoCol.findOne({ label: "jangsin" });

  const isApp = await Bcrypt.compare(client_key, getInfo.info);

  // console.log(isApp);

  if (!isApp) {

    return Utility.ERROR("client auth", "invalid client", 403);
  }
};

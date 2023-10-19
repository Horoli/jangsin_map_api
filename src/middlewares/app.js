const MongoDB = require("../mongodb");
const Bcrypt = require("bcrypt");

module.exports = async (req, rep) => {
  const { client_key } = req.headers;

  // console.log('client_key', client_key);
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
    const error = new Error("Error : invalid client");
    error.status = 403;
    return error;
  }
};

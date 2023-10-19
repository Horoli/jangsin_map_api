const MongoDB = require("../mongodb");
const Bcrypt = require("bcrypt");

module.exports = async (req, rep) => {
  const { app_info } = req.headers;

  console.log('app_info', app_info);
  const appInfoCol = await MongoDB.getCollection("appInfo");

  const getAppInfo = await appInfoCol.findOne({ label: "jangsin" });
  console.log(getAppInfo);

  // TODO : must delete
  if (getAppInfo === null) {
    const setInfo = await Bcrypt.hash("jang-sin", 10);
    await appInfoCol.insertOne({
      label: "jangsin",
      info: setInfo,
    });
  }

  const getInfo = await appInfoCol.findOne({ label: "jangsin" });

  const isApp = await Bcrypt.compare(app_info, getInfo.info);

  if (!isApp) {
    const error = new Error("Error : invalid client");
    error.status = 403;
    return error;
  }
};

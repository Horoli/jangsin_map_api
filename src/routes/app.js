
const Path = require("path");
const Fs = require("fs");

module.exports = {
  "GET /aaa": {
    // middlewares:[],
    async handler(req, res) {
      const path = Path.join(__dirname, '..', 'index.html');
      const getHtml = Fs.readFileSync(path).toString('utf-8');

      console.log(getHtml);

      res.type("text/html").send(getHtml);
    },
  },
};

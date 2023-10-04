
const Path = require("path");
const Fs = require("fs");

module.exports = {
  "GET /aaa": {
    // middlewares:[],
    async handler(req, res) {
      // const path = Path.join(__dirname, '..', 'index.html');
      // const getHtml = Fs.readFileSync(path).toString('utf-8');

      // console.log(getHtml);

      // res.type("text/html").send(getHtml);

      const title = "hello";

      const lat = "37.4824419369998";
      const lng = "126.84983521857548";

      var html = `
          <!DOCTYPE html>
          <html>

          <head>
              <meta charset="UTF-8">
              <meta http-equiv="X-UA-Compatible" content="IE=edge">
              <meta name="viewport"
                  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">
              <title>${title}</title>
              <script type="text/javascript"
                  src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=rey7y37ny0"></script>
          </head>

          <body>
              <div id="map" style="width:60%;height:600px;margin:0 auto;"></div>
              <script>
              var center = new naver.maps.LatLng(${lat}, ${lng});
              var mapOptions = { center: center, zoom: 20 };
              var map = new naver.maps.Map('map', mapOptions);

              var marker = new naver.maps.Marker({
                position: center,
                map: map,
              });
              </script>
          </body>

          </html>
      `

      res.type("text/html").send(html);
    },
  },
};

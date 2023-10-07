const Path = require("path");
const Fs = require("fs");
const MongoDB = require("../mongodb");

module.exports = {
  "POST /create": {
    // middlewares:[],
    async handler(req, res) {
      const {
        type,
        label,
        contact,
        info,
        description,
        representative_menu,
        lat,
        lng,
        address_sido,
        address_sigungu,
        address_eupmyeondong,
        address_detail,
        address_street,
        closed_days,
        opertaion_time,
        sns,
        youtube_uploadedAt,
        youtube_link,
        baemin_link,
        thumbnail,
      } = req.body;

      if (
        label === undefined ||
        contact === undefined ||
        lat === undefined ||
        lng === undefined
      ) {
        const error = new Error("required parameter is empty");
        error.status = 400;
        return error;
      }

      const jangsinCol = await MongoDB.getCollection("map");

      const newData = {
        type: type ?? "restaurant",
        label: label,
        contact: contact,
        representative_menu: representative_menu ?? "",
        info: info ?? "",
        description: description ?? "",
        lat: lat,
        lng: lng,
        address_sido: address_sido ?? "",
        address_sigungu: address_sigungu ?? "",
        address_eupmyeondong: address_eupmyeondong ?? "",
        address_detail: address_detail ?? "",
        address_street: address_street ?? "",
        closed_days: closed_days ?? "",
        opertaion_time: opertaion_time ?? "",
        sns: sns ?? "",
        youtube_uploadedAt: youtube_uploadedAt ?? "",
        youtube_link: youtube_link ?? "",
        baemin_link: baemin_link ?? "",
        thumbnail: thumbnail ?? "",
      };

      jangsinCol.insertOne(newData);

      return {
        status: 200,
        message: `${new Date().toLocaleString()} [${label}] update complete`,
      };
    },
  },

  "GET /get": {
    async handler(req, res) {
      const jangsinCol = await MongoDB.getCollection("map");
      const getData = await jangsinCol.find().toArray();
      return {
        status: 200,
        data: getData,
      };
    },
  },

  // TODO : 시/도로 쿼리
  // "GET /country": {},

  "GET /latlng": {
    async handler(req, res) {
      const jangsinCol = await MongoDB.getCollection("map");
      // TODO : mongodb project을 사용해서 lat,lng데이터만 쿼리
      const getData = await jangsinCol
        .find({ type: "restaurant" })
        .project({ _id: 0, lat: 1, lng: 1 })
        .toArray();
      // TODO : client에서 선택된 데이터만 가져와서 초기값을 활용해 marker를 추가

      return {
        status: 200,
        data: getData,
      };
    },
  },

  // "GET /aaaa": {
  //   // middlewares:[],
  //   async handler(req, res) {
  //     // const path = Path.join(__dirname, '..', 'index.html');
  //     // const getHtml = Fs.readFileSync(path).toString('utf-8');

  //     // console.log(getHtml);

  //     // res.type("text/html").send(getHtml);

  //     const title = "hello";

  //     const lat = "37.4824419369998";
  //     const lng = "126.84983521857548";

  //     var html = `
  //         <!DOCTYPE html>
  //         <html>

  //         <head>
  //             <meta charset="UTF-8">
  //             <meta http-equiv="X-UA-Compatible" content="IE=edge">
  //             <meta name="viewport"
  //                 content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">
  //             <title>${title}</title>
  //             <script type="text/javascript"
  //                 src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=rey7y37ny0"></script>
  //         </head>

  //         <body>
  //             <div id="map" style="width:60%;height:600px;margin:0 auto;"></div>
  //             <script>
  //             var center = new naver.maps.LatLng(${lat}, ${lng});
  //             var mapOptions = { center: center, zoom: 20 };
  //             var map = new naver.maps.Map('map', mapOptions);

  //             var marker = new naver.maps.Marker({
  //               position: center,
  //               map: map,
  //             });
  //             </script>
  //         </body>

  //         </html>
  //     `;

  //     res.type("text/html").send(html);
  //   },
  // },
};

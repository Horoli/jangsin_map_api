const Utility = require("@Utility/utility");
const MongoDB = require("@Utility/mongodb");
const Crypto = require("crypto");

module.exports = {
  "GET /visitor": {
    async handler(req, res) {
      const visitorCol = await MongoDB.getCollection("visitorCount");
      const count = await visitorCol.count();
      return {
        statusCode: 200,
        message: `전체 방문자 수 : ${count}`,
      };
    },
  },

  "GET /visitor_update": {
    middlewares: ["app"],
    async handler(req, res) {
      const visitorCol = await MongoDB.getCollection("visitorCount");
      /*

      ip를 hash해서 저장 후, 방문자 관련 정보를 저장

      */

      const hash = Crypto.createHash("sha256").update(req.ip);
      const hashedIp = hash.digest("hex");

      const ipFindResult = await visitorCol.findOne({
        ip: hashedIp,
        visited_at: {
          $gte: Date.now() - 1000 * 60 * 60 * 24,
        },
      });

      if (ipFindResult === null) {
        await visitorCol.insertOne({ ip: hashedIp, visited_at: Date.now() });
      }
      return {
        statusCode: 200,
        message: "visitor update",
      };
    },
  },

  "GET /mau": {
    middlewares: [],
    async handler(req, res) {
      const visitorCol = await MongoDB.getCollection("visitorCount");

      const startDateString = "2023-11-01T00:00:00.000Z";
      const startDate = new Date(Date.parse(startDateString));
      const now = new Date();

      // 시작일로 부터 현재일까지 년-월 리스트를 추출
      let monthList = [];
      let currentDate = startDate;
      while (currentDate <= now) {
        monthList.push(
          `${currentDate.getUTCFullYear()}-${currentDate.getUTCMonth() + 1}`
        );
        currentDate = new Date(
          Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + 1)
        );
      }

      console.log(monthList);

      // DB에 저장된 visited_at과 비교하기 위해 milisecond로 parse
      let totalMAU = 0;
      let total = 0;

      const getMAUByMonth = await Promise.all(
        monthList.map(async (month) => {
          let result = {};
          const getIndex = monthList.indexOf(month);
          const lastIndex = monthList.length - 1;

          const targetMonth = Date.parse(month);

          console.log(targetMonth);

          if (getIndex != lastIndex) {
            const getFilteringDataByVisitedAt = await visitorCol
              .find({
                visited_at: {
                  $gte: targetMonth,
                  $lte: Date.parse(monthList[getIndex + 1]),
                },
              })
              .toArray();

            // ip를 기준으로 중복데이터 제거
            const uniqueResults = getFilteringDataByVisitedAt.filter(
              (value, index, array) =>
                array.findIndex((target) => target.ip === value.ip) === index
            );

            total += getFilteringDataByVisitedAt.length;
            totalMAU += uniqueResults.length;

            result[monthList[getIndex]] = {
              total: getFilteringDataByVisitedAt.length,
              MAU: uniqueResults.length,
            };
            return result;
          }
        })
      );

      const removeNullGetMAUByMonth = getMAUByMonth.filter((e) => {
        return e !== undefined;
      });

      const average = {
        total: (total / removeNullGetMAUByMonth.length).toFixed(2),
        mau: (totalMAU / removeNullGetMAUByMonth.length).toFixed(2),
      };

      return {
        statusCode: 200,
        data: {
          average: average,
          monthly: removeNullGetMAUByMonth,
        },
      };
    },
  },
};

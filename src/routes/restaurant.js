const Path = require("path");
const Fs = require("fs");
const MongoDB = require("../mongodb");
const Utility = require("../utility");

module.exports = {
  "POST /create": {
    // middlewares: ["auth"],
    async handler(req, res) {
      const {
        id,
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
        sns_link,
        naver_map_link,
        youtube_uploadedAt,
        youtube_link,
        baemin_link,
        thumbnail,
      } = req.body;

      // TODO : id가 입력되었으면 에러처리
      if (id !== undefined) {
        return Utility.ERROR(req.raw.url, "remove input id", 400)
      }

      // TODO : 필수 파라미터가 없으면 에러 처리
      if (
        label === undefined ||
        contact === undefined ||
        lat === undefined ||
        lng === undefined
      ) {
        return Utility.ERROR(req.raw.url, "required parameter is empty", 400)
      }
      const jangsinCol = await MongoDB.getCollection("restaurant");

      const getDataByLabel = await jangsinCol.findOne({ label: label });
      console.log('getDataByLabel', getDataByLabel);
      // TODO : 가게명이 중복되면 에러 처리
      if (getDataByLabel != null) {
        return Utility.ERROR(req.raw.url, "Duplicated label", 400)
      }

      console.log('typeof lat', typeof lat, typeof lat === "number");


      if (typeof lat !== "number" || typeof lng !== "number") {
        return Utility.ERROR(req.raw.url, "lat, lng aren't number(double)", 400)
      }





      // TODO : 생성할 때에는 id를 입력받지 않고, 자동 생성하여 부여
      const newRestaurant = {
        id: Utility.UUID(),
        label: label, // 가게명
        contact: contact, // 연락처
        representative_menu: representative_menu ?? "", // 대표메뉴
        info: info ?? "", // 기타정보
        description: description ?? "", // 메모
        lat: lat, // 위도
        lng: lng, // 경도
        address_sido: address_sido ?? "",
        address_sigungu: address_sigungu ?? "",
        address_eupmyeondong: address_eupmyeondong ?? "",
        address_detail: address_detail ?? "",
        address_street: address_street ?? "",
        closed_days: closed_days ?? "", // 휴무일
        opertaion_time: opertaion_time ?? "", // 영업시간
        sns_link: sns_link ?? "", // sns 링크
        naver_map_link: naver_map_link ?? "", // naverMap 링크
        youtube_uploadedAt: youtube_uploadedAt ?? "", // 유튜브 업로드일자
        youtube_link: youtube_link ?? "", // 유튜브 링크
        baemin_link: baemin_link ?? "", // 배민링크
        thumbnail: thumbnail ?? "", // 썸네일 이미지 Id
      };

      jangsinCol.insertOne(newRestaurant);

      return {
        status: 200,
        message: `${new Date().toLocaleString()} [${label}] update complete`,
      };
    },
  },

  "POST /update": {
    // middlewares: ["auth"],
    async handler(req, res) {
      const {
        id,
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
        sns_link,
        naver_map_link,
        youtube_uploadedAt,
        youtube_link,
        baemin_link,
        thumbnail,
      } = req.body;

      const jangsinCol = await MongoDB.getCollection("restaurant");
      const getDataById = await jangsinCol.findOne({ id: id });


      // TODO : 일치하는 id가 없으면 에러 처리
      if (getDataById === null) {
        return Utility.ERROR(req.raw.url, "required parameter is empty", 400)
      }

      // TODO : 입력받은 모든 parameter의 typeof를 확인
      if (
        typeof getDataById.label != typeof label ||
        typeof getDataById.contact != typeof contact ||
        typeof getDataById.info != typeof info ||
        // typeof getDataById.description != typeof description ||
        // typeof getDataById.representative_menu != typeof representative_menu ||
        typeof getDataById.lat != typeof lat ||
        typeof getDataById.lng != typeof lng ||
        typeof getDataById.address_sido != typeof address_sido ||
        typeof getDataById.address_sigungu != typeof address_sigungu
        // typeof getDataById.address_eupmyeondong != typeof address_eupmyeondong ||
        // typeof getDataById.address_detail != typeof address_detail ||
        // typeof getDataById.address_street != typeof address_street ||
        // typeof getDataById.closed_days != typeof closed_days ||
        // typeof getDataById.opertaion_time != typeof opertaion_time ||
        // typeof getDataById.sns_link != typeof sns_link ||
        // typeof getDataById.naver_map_link != typeof naver_map_link ||
        // typeof getDataById.youtube_uploadedAt != typeof youtube_uploadedAt ||
        // typeof getDataById.youtube_link != typeof youtube_link ||
        // typeof getDataById.baemin_link != typeof baemin_link ||
        // typeof getDataById.thumbnail != typeof thumbnail
      ) {

        return Utility.ERROR(req.raw.url, 'required parameter is empty', 403)
      }

      // TODO : update시 기존 데이터를 유지하고 변경된 데이터만 update
      const updateRestaurant = {
        label: label ?? getDataById.label,
        contact: contact ?? getDataById.contact,
        info: info ?? getDataById.info,
        description: description ?? getDataById.description,
        representative_menu: representative_menu ?? getDataById.representative_menu,
        lat: lat ?? getDataById.lat,
        lng: lng ?? getDataById.lng,
        address_sido: address_sido ?? getDataById.address_sido,
        address_sigungu: address_sigungu ?? getDataById.address_sigungu,
        address_eupmyeondong: address_eupmyeondong ?? getDataById.address_eupmyeondong,
        address_detail: address_detail ?? getDataById.address_detail,
        address_street: address_street ?? getDataById.address_street,
        closed_days: closed_days ?? getDataById.closed_days,
        opertaion_time: opertaion_time ?? getDataById.opertaion_time,
        sns_link: sns_link ?? getDataById.sns_link,
        naver_map_link: naver_map_link ?? getDataById.naver_map_link,
        youtube_uploadedAt: youtube_uploadedAt ?? getDataById.youtube_uploadedAt,
        youtube_link: youtube_link ?? getDataById.youtube_link,
        baemin_link: baemin_link ?? getDataById.baemin_link,
        thumbnail: thumbnail ?? getDataById.thumbnail
      }

      jangsinCol.updateOne({ id: id }, { $set: updateRestaurant });

      return {
        status: 200,
        message: `${new Date().toLocaleString()} [${label}] update complete`,
      }
    }
  }
  ,

  "GET /get": {
    middlewares: ["app"],
    async handler(req, res) {
      const jangsinCol = await MongoDB.getCollection("restaurant");
      const getData = await jangsinCol.find().toArray();
      return {
        status: 200,
        data: getData,
      };
    },
  },

  // TODO : 시/도로 쿼리
  // "GET /country/:id": {
  //   async handler(req, res) {
  //     const { id } = req.query;
  //     console.log(id);
  //     return {
  //       data: id
  //     };
  //   }
  // },

  "GET /latlng": {
    middlewares: ["app"],
    async handler(req, res) {
      const jangsinCol = await MongoDB.getCollection("restaurant");
      // TODO : mongodb project을 사용해서 lat,lng데이터만 쿼리
      const getData = await jangsinCol
        .find()
        .project({ _id: 0, lat: 1, lng: 1 })
        .toArray();
      // TODO : client에서 선택된 데이터만 가져와서 초기값을 활용해 marker를 추가

      return {
        status: 200,
        data: getData,
      };
    },
  },
};

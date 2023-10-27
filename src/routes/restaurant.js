const Path = require("path");
const Fs = require("fs");
const MongoDB = require("../mongodb");
const Utility = require("../utility");
const Axios = require("axios");
const sharp = require("sharp");

module.exports = {
  "POST /create": {
    middlewares: ["auth"],
    async handler(req, res) {
      const {
        id,
        source, // 가게 출처(장사의 신 유튜브, 타 방송, 장쉼카페 회원 가게)
        label, // 가게명
        contact, // 연락처
        info, // 정보
        description, // 메모
        representative_menu, // 대표메뉴
        address_sido, // 주소 - 시도
        address_sigungu, // 주소 - 시군구
        address_eupmyeondong, // 주소 - 읍면동
        address_detail, // 주소 - 세부
        closed_days, // 휴무일
        operation_time, // 영업시간
        youtube_uploadedAt,
        sns_link, //
        naver_map_link,
        youtube_link,
        baemin_link,
      } = req.body;

      let { thumbnail, add_thumbnail } = req.body;

      // TODO : id가 입력되었으면 에러처리
      if (id !== "") {
        return Utility.ERROR(req.raw.url, "remove input id", 400);
      }

      if (
        label === undefined ||
        label === "" ||
        address_sido === undefined ||
        address_sido === "" ||
        address_sigungu === undefined ||
        address_sigungu === "" ||
        contact === undefined ||
        contact === ""
      ) {
        return Utility.ERROR(req.raw.url, "required parameter is empty", 400);
      }
      // 변환하려는 주소를 입력합니다.
      const address = encodeURIComponent(
        `${address_sido} ${address_sigungu} ${address_eupmyeondong} ${address_detail}`
      );

      // Naver Maps Geocoding API URL을 설정합니다.
      const geocodeUrl = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${address}`;

      try {
        const response = await Axios.get(geocodeUrl, {
          headers: Utility.NAVER_CLIENT_HEADER,
        });

        if (response.data.status === "OK") {
          const location = response.data.addresses[0];
          // 네이버 Maps Geocoding API로 받은 데이터를 활용합니다.
          const naverGetLat = Number(location.y);
          const naverGetLng = Number(location.x);
          // 도로명 주소는 address_detail을 뒤에 추가해 줌
          const naverGetStreetAddress = `${location.roadAddress} ${address_detail}`;

          const restaurantCol = await MongoDB.getCollection("restaurant");
          const imageCol = await MongoDB.getCollection("image");

          const getDataByLabel = await restaurantCol.findOne({ label: label });

          // TODO : 가게명이 중복되면 에러 처리
          if (getDataByLabel != null) {
            return Utility.ERROR(req.raw.url, "Duplicated label", 400);
          }

          if (add_thumbnail !== undefined || add_thumbnail !== "") {
            const uuid = Utility.UUID(true);
            const base64Data = add_thumbnail.replace(
              /^data:image\/jpeg;base64,/,
              ""
            );
            console.log(base64Data);
            await imageCol.insertOne({
              id: uuid,
              image: base64Data,
              type: "thumbnail",
            });
            thumbnail = uuid;
          }

          console.log("thumbnail", thumbnail);

          // TODO : 생성할 때에는 id를 입력받지 않고, 자동 생성하여 부여
          const newRestaurant = {
            id: Utility.UUID(),
            source: source ?? "",
            label: label, // 가게명
            contact: contact, // 연락처
            representative_menu: representative_menu ?? "", // 대표메뉴
            info: info ?? "", // 기타정보
            description: description ?? "", // 메모
            lat: naverGetLat, // 위도
            lng: naverGetLng, // 경도
            address_sido: address_sido ?? "",
            address_sigungu: address_sigungu ?? "",
            address_eupmyeondong: address_eupmyeondong ?? "",
            address_detail: address_detail ?? "",
            address_street: naverGetStreetAddress,
            closed_days: closed_days ?? "", // 휴무일
            operation_time: operation_time ?? "", // 영업시간
            sns_link: sns_link ?? "", // sns 링크
            naver_map_link: naver_map_link ?? "", // naverMap 링크
            youtube_uploadedAt: youtube_uploadedAt ?? "", // 유튜브 업로드일자
            youtube_link: youtube_link ?? "", // 유튜브 링크
            baemin_link: baemin_link ?? "", // 배민링크
            thumbnail: thumbnail ?? "", // 썸네일 이미지 Id
            created_at: new Date().getTime(),
            updated_at: new Date().getTime(),
          };

          await restaurantCol.insertOne(newRestaurant);

          return {
            statusCode: 200,
            message: `${new Date().toLocaleString()} [${label}] update complete`,
            data: {},
          };
        } else {
          return Utility.EEROR(
            req.raw.url,
            `geocoding failed :  + ${response.data.status}`,
            400
          );
        }
      } catch (error) {
        return Utility.ERROR(req.raw.url, `geocoding error : ${error}`, 400);
      }
    },
  },

  "POST /create_csv_upload": {
    middlewares: ["auth"],
    async handler(req, res) {
      const { csv } = req.body;

      let duplicatedDatas = [];

      console.log("step 1");
      if (csv === null || csv === undefined) {
        return Utility.ERROR(req.raw.url, `csv is null`, 403);
      }

      const restaurantCol = await MongoDB.getCollection("restaurant");
      const imageCol = await MongoDB.getCollection("image");

      // csv로 입력받은 데이터를 저장할 array
      const restaurantObjectArrays = await dataConvert();
      console.log("step 1 : dataConvert");
      const filteredData = await dataFiltering(restaurantObjectArrays);

      console.log('length', filteredData.length);

      if (filteredData.length === 0) {
        return {
          statusCode: 403,
          message: `${new Date().toLocaleString()} filteredData is empty`,
          data: {},
        };
      }

      console.log("step 2 : dataFiltering");
      const finalRestaurant = await getThumbnailByUrl([...filteredData]);
      console.log("step 3 : getThumbnailByUrl");
      await getGeocodingData(finalRestaurant);
      // console.log("step 4 : getGeocodingData", updateNewRestaurants);

      async function dataConvert() {
        // TODO : csv header 추출
        const columnHeader = csv[0];
        // header를 제거하기 위해 copyCsv를 생성
        const copyCsv = csv.splice(1);
        let restaurantObjectArrays = [];

        for (const csvIndex in copyCsv) {
          let individualRestaurantObject = {};
          for (
            let columnHeaderIndex = 0;
            columnHeaderIndex < columnHeader.length;
            columnHeaderIndex++
          ) {
            individualRestaurantObject[columnHeader[columnHeaderIndex]] =
              copyCsv[csvIndex][columnHeaderIndex];
          }
          restaurantObjectArrays.push(individualRestaurantObject);
        }

        return restaurantObjectArrays;
      }

      // TODO : 입력받은 csv에 포함된 중복은 걸러내지 못하는 상태
      async function dataFiltering(inputRestaurants) {
        // TODO : label이 없는 데이터 제거
        let extractedData = inputRestaurants.filter(
          (value) => value.label !== undefined
        );

        // TODO : label이 중복되는 데이터 제거
        extractedData = extractedData.filter(
          (value, index, self) =>
            index ===
            self.findIndex((t) => t.label === value.label && t.label !== "")
        );

        // TODO : mongoDB에 저장된 데이터와 비교하여 중복된 데이터 제거
        const filteringData = await Promise.all(
          extractedData.map(async (restaurant) => {
            const findResult = await restaurantCol.find({ label: restaurant.label }).toArray();
            if (findResult.length === 0) {
              return restaurant;
            }
          }
          ));

        const finalFilteredData = filteringData.filter((value) => value !== undefined);
        console.log('finalFilteredData', finalFilteredData)
        return finalFilteredData;
      }

      async function getThumbnailByUrl(inputRestaurants) {
        const getRestaurants = await Promise.all(
          inputRestaurants.map(async (innerRestaurant) => {
            const getImage = await Axios.get(innerRestaurant.thumbnail, {
              responseType: "stream",
            });
            const imageType = "jpeg";
            const sharpTransformer = sharp()
              .resize(200, 200)
              .toFormat(imageType);
            const sharpImage = await getImage.data
              .pipe(sharpTransformer)
              .toBuffer()
              .catch((err) => err);

            const base64Image = sharpImage.toString("base64");

            let modifyingRestaurant = Object.assign(innerRestaurant);
            modifyingRestaurant["thumbnail"] = base64Image;

            return modifyingRestaurant;
          })
        );
        return getRestaurants;
      }

      async function getGeocodingData(inputRestaurants) {
        console.log("inputRestaurants", inputRestaurants);

        await Promise.all(
          inputRestaurants.map(async (restaurant) => {
            const address = encodeURIComponent(
              `${restaurant.address_sido} ${restaurant.address_sigungu} ${restaurant.address_eupmyeondong} ${restaurant.address_detail}`
            );

            const geocodeUrl = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${address}`;

            const response = await Axios.get(geocodeUrl, {
              headers: Utility.NAVER_CLIENT_HEADER,
            });

            if (response.data.status === "OK") {
              const location = response.data.addresses[0];
              // 네이버 Maps Geocoding API로 받은 데이터를 활용합니다.
              const naverGetLat = Number(location.y);
              const naverGetLng = Number(location.x);
              // 도로명 주소는 address_detail을 뒤에 추가해 줌
              const naverGetStreetAddress = `${location.roadAddress} ${restaurant.address_detail}`;

              const restaurantId = Utility.UUID();
              const imageId = Utility.UUID(true);

              const updateNewRestaurant = {
                id: restaurantId,
                source: restaurant.source ?? "",
                label: restaurant.label, // 가게명
                contact: restaurant.contact, // 연락처
                representative_menu: restaurant.representative_menu ?? "", // 대표메뉴
                info: restaurant.info ?? "", // 기타정보
                description: restaurant.description ?? "", // 메모
                lat: naverGetLat, // 위도
                lng: naverGetLng, // 경도
                address_sido: restaurant.address_sido ?? "",
                address_sigungu: restaurant.address_sigungu ?? "",
                address_eupmyeondong: restaurant.address_eupmyeondong ?? "",
                address_detail: restaurant.address_detail ?? "",
                address_street: naverGetStreetAddress,
                closed_days: restaurant.closed_days ?? "", // 휴무일
                operation_time: restaurant.operation_time ?? "", // 영업시간
                sns_link: restaurant.sns_link ?? "", // sns 링크
                naver_map_link: restaurant.naver_map_link ?? "", // naverMap 링크
                youtube_uploadedAt: restaurant.youtube_uploadedAt ?? "", // 유튜브 업로드일자
                youtube_link: restaurant.youtube_link ?? "", // 유튜브 링크
                baemin_link: restaurant.baemin_link ?? "", // 배민링크
                thumbnail: imageId ?? "", // 썸네일 이미지 Id
                created_at: new Date().getTime(),
                updated_at: new Date().getTime(),
              };

              await imageCol.insertOne({
                id: imageId,
                image: restaurant.thumbnail,
                type: "thumbnail",
              });

              await restaurantCol.insertOne(updateNewRestaurant);
            }
          })
        );
      }

      return {
        statusCode: 200,
        message: `${new Date().toLocaleString()} csv update complete`,
        data: {},
      };
    },
  },

  "POST /patch": {
    middlewares: ["auth"],
    async handler(req, res) {
      const {
        id,
        source,
        label,
        contact,
        info,
        description,
        representative_menu,
        address_sido,
        address_sigungu,
        address_eupmyeondong,
        address_detail,
        closed_days,
        operation_time,
        sns_link,
        naver_map_link,
        youtube_uploadedAt,
        youtube_link,
        baemin_link,
      } = req.body;

      let { thumbnail, add_thumbnail } = req.body;

      const restaurantCol = await MongoDB.getCollection("restaurant");
      const imageCol = await MongoDB.getCollection("image");
      const getDataById = await restaurantCol.findOne({ id: id });

      // TODO : 일치하는 id가 없으면 에러 처리
      if (getDataById === null) {
        return Utility.ERROR(req.raw.url, "required parameter is empty", 400);
      }

      // TODO : 입력받은 모든 parameter의 typeof를 확인
      if (
        typeof getDataById.label != typeof label ||
        typeof getDataById.contact != typeof contact ||
        typeof getDataById.info != typeof info ||
        // typeof getDataById.description != typeof description ||
        // typeof getDataById.representative_menu != typeof representative_menu ||
        typeof getDataById.address_sido != typeof address_sido ||
        typeof getDataById.address_sigungu != typeof address_sigungu
        // typeof getDataById.address_eupmyeondong != typeof address_eupmyeondong ||
        // typeof getDataById.address_detail != typeof address_detail ||
        // typeof getDataById.address_street != typeof address_street ||
        // typeof getDataById.closed_days != typeof closed_days ||
        // typeof getDataById.operation_time != typeof operation_time ||
        // typeof getDataById.sns_link != typeof sns_link ||
        // typeof getDataById.naver_map_link != typeof naver_map_link ||
        // typeof getDataById.youtube_uploadedAt != typeof youtube_uploadedAt ||
        // typeof getDataById.youtube_link != typeof youtube_link ||
        // typeof getDataById.baemin_link != typeof baemin_link ||
        // typeof getDataById.thumbnail != typeof thumbnail
      ) {
        return Utility.ERROR(req.raw.url, "required parameter is empty", 403);
      }

      // 변환하려는 주소를 입력합니다.
      const address = encodeURIComponent(
        `${address_sido} ${address_sigungu} ${address_eupmyeondong} ${address_detail}`
      );

      // Naver Maps Geocoding API URL을 설정합니다.
      const geocodeUrl = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${address}`;

      try {
        const response = await Axios.get(geocodeUrl, {
          headers: Utility.NAVER_CLIENT_HEADER,
        });

        if (response.data.status === "OK") {
          const location = response.data.addresses[0];
          const naverGetLat = Number(location.y);
          const naverGetLng = Number(location.x);
          // 도로명 주소는 address_detail을 뒤에 추가해 줌
          const naverGetStreetAddress = `${location.roadAddress} ${address_detail}`;
          console.log(location);

          // TODO : 기존에 저장된 이미지가 없고, 이미지가 없을 떄
          if (add_thumbnail === "" && getDataById.thumbnail === "") {
            thumbnail = "";
          }

          // TODO : 기존에 저장된 이미지가 있고, 새로운 이미지가 없을 때
          if (add_thumbnail === "" && getDataById.thumbnail !== "") {
            thumbnail = getDataById.thumbnail;
          }

          // TODO : 기존에 저장된 이미지가 없고, 새로운 이미지가 있을 때
          if (add_thumbnail !== "" && getDataById.thumbnail === "") {
            const uuid = Utility.UUID(true);
            const base64Data = add_thumbnail.replace(
              /^data:image\/jpeg;base64,/,
              ""
            );
            await imageCol.insertOne({
              id: uuid,
              image: base64Data,
              type: "thumbnail",
            });
            thumbnail = uuid;
          }

          // TODO : 기존에 저장된 이미지가 있고, 새로운 이미지가 있을 때
          if (add_thumbnail !== "" && getDataById.thumbnail !== "") {
            await imageCol.deleteOne({ id: getDataById.thumbnail });

            const uuid = Utility.UUID(true);
            const base64Data = add_thumbnail.replace(
              /^data:image\/jpeg;base64,/,
              ""
            );
            await imageCol.insertOne({
              id: uuid,
              image: base64Data,
              type: "thumbnail",
            });
            thumbnail = uuid;
          }

          // TODO : update시 기존 데이터를 유지하고 변경된 데이터만 update
          const updateRestaurant = {
            source: source ?? getDataById.source,
            label: label ?? getDataById.label,
            contact: contact ?? getDataById.contact,
            info: info ?? getDataById.info,
            description: description ?? getDataById.description,
            representative_menu:
              representative_menu ?? getDataById.representative_menu,
            lat: naverGetLat,
            lng: naverGetLng,
            address_sido: address_sido ?? getDataById.address_sido,
            address_sigungu: address_sigungu ?? getDataById.address_sigungu,
            address_eupmyeondong:
              address_eupmyeondong ?? getDataById.address_eupmyeondong,
            address_detail: address_detail ?? getDataById.address_detail,
            address_street: naverGetStreetAddress ?? getDataById.address_street,
            closed_days: closed_days ?? getDataById.closed_days,
            operation_time: operation_time ?? getDataById.operation_time,
            sns_link: sns_link ?? getDataById.sns_link,
            naver_map_link: naver_map_link ?? getDataById.naver_map_link,
            youtube_uploadedAt:
              youtube_uploadedAt ?? getDataById.youtube_uploadedAt,
            youtube_link: youtube_link ?? getDataById.youtube_link,
            baemin_link: baemin_link ?? getDataById.baemin_link,
            thumbnail: thumbnail ?? getDataById.thumbnail,
            created_at: getDataById.createdAt,
            updated_at: new Date().getTime(),
          };

          await restaurantCol.updateOne({ id: id }, { $set: updateRestaurant });

          return {
            statusCode: 200,
            message: `${new Date().toLocaleString()} [${label}] update complete`,
            data: {},
          };
        } else {
          return Utility.EEROR(
            req.raw.url,
            `geocoding failed :  + ${response.data.status}`,
            400
          );
        }
      } catch {
        return Utility.ERROR(req.raw.url, `geocoding error : ${error}`, 400);
      }
    },
  },

  "GET /get": {
    middlewares: ["app"],
    async handler(req, res) {
      const jangsinCol = await MongoDB.getCollection("restaurant");
      const getData = await jangsinCol.find().toArray();
      return {
        statusCode: 200,
        data: getData,
      };
    },
  },

  /* 
  TODO : 
    대표메뉴(representative_menu)로 필터링하는 쿼리 추가
    가게출처(source)로 필터링하는 쿼리 추가
  */
  "GET /pagination/:page:limit:sido": {
    middlewares: ["app"],
    async handler(req, res) {
      const selectedPage = parseInt(req.query.page);
      const limit = parseInt(req.query.limit);
      const sido = req.query.sido;
      // const sigungu = req.query.sigungu;
      const restaurantCol = await MongoDB.getCollection("restaurant");
      const totalCount = await restaurantCol.count();

      // console.log(
      //   "sido",
      //   typeof sido,
      //   sido === null,
      //   sido === undefined,
      //   sido === ""
      // );
      // console.log(
      //   "sigungu",
      //   typeof sigungu,
      //   sigungu === null,
      //   sigungu === undefined,
      //   sigungu === ""
      // );

      if (totalCount === 0) {
        console.log(totalCount);
        return Utility.ERROR(req.raw.url, "restaurantCol is empty", 400);
      }

      const startIndex = (selectedPage - 1) * limit;
      // TODO : sido만 입력되었으면 sido로 쿼리
      if (sido !== undefined) {
        const queryData = await restaurantCol
          .find({ address_sido: sido })
          .skip(startIndex)
          .limit(limit)
          .toArray();

        console.log("sido queryData", queryData);
        const queryCount = await restaurantCol.count({ address_sido: sido });
        const totalQueryPage = Math.ceil(queryCount / limit);

        return {
          statusCode: 200,
          message: `sido || total_page : ${totalQueryPage} || pagination : ${selectedPage}`,
          data: {
            dataCount: queryCount,
            total_page: totalQueryPage,
            selected_page: selectedPage,
            pagination_data: queryData,
          },
        };
      }

      // TODO : sido가 입력되고, sigungu도 입력되면 sido, sigungu로 쿼리
      if (sido !== undefined && sigungu !== undefined) {
        const queryData = await restaurantCol
          .find({ address_sido: sido, address_sigungu: sigungu })
          .skip(startIndex)
          .limit(limit)
          .toArray();
        const queryCount = await restaurantCol.count({
          address_sido: sido,
          address_sigungu: sigungu,
        });
        const totalQueryPage = Math.ceil(queryCount / limit);
        return {
          statusCode: 200,
          message: `sido + sigungu || total_page : ${totalQueryPage} || pagination : ${selectedPage}`,
          data: {
            dataCount: queryCount,
            total_page: totalQueryPage,
            selected_page: selectedPage,
            pagination_data: queryData,
          },
        };
      }

      const totalDataCount = await restaurantCol.count();
      const totalPage = Math.ceil(totalDataCount / limit);

      if (selectedPage > totalPage)
        return Utility.ERROR(req.raw.url, "page is over", 400);
      const getPagination = await restaurantCol
        .find()
        .skip(startIndex)
        .limit(limit)
        .toArray();

      return {
        statusCode: 200,
        message: `total_page : ${totalPage} || pagination : ${selectedPage}`,
        data: {
          limit: limit,
          dataCount: totalDataCount,
          total_page: totalPage,
          selected_page: selectedPage,
          pagination_data: getPagination,
        },
      };
    },
  },

  "DELETE /delete": {
    middlewares: ["app"],
    async handler(req, res) {
      const { id } = req.body;

      console.log("delete", id);
      if (id === null || id === undefined) {
        return Utility.ERROR(req.raw.url, "id is empty", 400);
      }
      const restaurantCol = await MongoDB.getCollection("restaurant");
      const imageCol = await MongoDB.getCollection("image");

      const target = await restaurantCol.findOne({ id: id });
      if (target === null || target === undefined) {
        return Utility.ERROR(req.raw.url, "target is not exist", 400);
      }

      const thumbnailId = target.thumbnail;

      console.log(target);

      await imageCol.deleteOne({ id: thumbnailId });
      await restaurantCol.deleteOne({ id: id });

      return {
        statusCode: 200,
        message: `${new Date().toLocaleString()} [${id}] delete complete`,
        data: {},
      };
    },
  },

  "GET /latlng": {
    middlewares: ["app"],
    async handler(req, res) {
      const restaurantCol = await MongoDB.getCollection("restaurant");
      // TODO : mongodb project을 사용해서 lat,lng데이터만 쿼리
      const getData = await restaurantCol
        .find()
        .project({ _id: 0, lat: 1, lng: 1 })
        .toArray();
      // TODO : client에서 선택된 데이터만 가져와서 초기값을 활용해 marker를 추가

      return {
        statusCode: 200,
        data: getData,
      };
    },
  },

  // "POST /test": {
  //   async handler(req, res) {
  //     const { url } = req.body;
  //     console.log(url);

  //     try {
  //       async function getContents(url) {
  //         const browser = await puppeteer.launch(
  //           { headless: "new" }
  //         );
  //         const page = await browser.newPage();
  //         await page.goto(url);

  //         // 웹사이트가 모든 동적 콘텐츠를 로드할 때까지 기다립니다.
  //         await page.waitForSelector('div.sc-48msce.bcmMFw');

  //         // 웹사이트에서 동적 콘텐츠를 가져옵니다.
  //         const content = await page.evaluate(() => {
  //           return document.querySelector('div.sc-48msce.bcmMFw').innerHTML;
  //         });

  //         await browser.close();
  //         return content;
  //       }

  //       const asd = await getContents(url)
  //       const $ = cheerio.load(asd);

  //       const src = $('iframe#searchIframe').attr('src');
  //       console.log('src', src);

  //       const zxc = await Axios.get(src)
  //       console.log(

  //         zxc.data
  //       )

  //       return {};

  //     } catch {
  //       return {};
  //     }

  //   }
};

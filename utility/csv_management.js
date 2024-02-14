class CSVManagement{

    /*
    입력받은 csv를 map으로 변환하는 함수
    */
    static async convert(csv) {
        const csvHeader = csv[0];
        // header를 제거하기 위해 copyCsv를 생성
        const headlessCSV = csv.splice(1);
        console.log("headlessCSV", headlessCSV.length);

        let restaurantObjectArrays = [];

        for (const csvIndex in headlessCSV) {
          let individualRestaurantObject = {};
          for (
            let columnHeaderIndex = 0;
            columnHeaderIndex < csvHeader.length;
            columnHeaderIndex++
          ) {
            // int나 double이 들어오는 경우 에러가 발생함. 무조건 String으로 변환
            // 앞 뒤 공백 제거 반드시 해줘야 함
            individualRestaurantObject[csvHeader[columnHeaderIndex]] =
              headlessCSV[csvIndex][columnHeaderIndex].toString().trim();
          }
          restaurantObjectArrays.push(individualRestaurantObject);
        }

        console.log("restaurantObjectArrays", restaurantObjectArrays.length);

        return restaurantObjectArrays;
    }

      /*
      변환한 csv 데이터에서 중복을 제거하는 함수
      */
     static async filtering(inputRestaurants) {
        // label이 없는 데이터 제거
        let extractedData = inputRestaurants.filter(
          (value) => value.label !== undefined
        );

        // label이 중복되는 데이터를 제거하기 위해 Set을 사용
        const labels = new Set();

        // 중복되지 않는 데이터만 추출
        extractedData = extractedData.filter((value) => {
          if (!labels.has(value.label)) {
            labels.add(value.label);
            return true;
          }
          return false;
        });

        // mongoDB에 저장된 데이터와 비교하여 중복되는 label들을 가져옴
        const existingLabels = new Set(
          (
            await restaurantCol
              .find({ label: { $in: Array.from(labels) } })
              .toArray()
          ).map((restaurant) => restaurant.label)
        );

        const finalFilteredData = extractedData.filter(
          (value) => !existingLabels.has(value.label)
        );

        console.log("finalFilteredData", finalFilteredData.length);

        return finalFilteredData;
      }

      /*
        변환한 csv 데이터에서 썸네일 이미지 url을 get하여
        sharp를 통해 size를 조정한 뒤
        base64로 변환하여 저장하는 함수
      */
      static async getThumbnailByUrl(inputRestaurants) {
        const getRestaurants = await Promise.all(
          inputRestaurants.map(async (innerRestaurant) => {
            // TODO : thumbnail === undefined || thumbnail === "" 일 경우
            if (
              innerRestaurant.thumbnail === undefined ||
              innerRestaurant.thumbnail === ""
            ) {
              console.log("thumbnail is undefined or empty");
              console.log("innerRestaurant", innerRestaurant);

              return innerRestaurant;
            }

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

}

module.exports = CSVManagement;
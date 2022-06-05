let barcodeNum = document.getElementById("result").innerHTML; // 바코드 13자리 숫자
let koreannet = `http://www.koreannet.or.kr/home/hpisSrchGtin.gs1?gtin=${barcodeNum}`; // 코리안넷 페이지
let koreannet_html; // 코리안넷 페이지 html 파일

// 1. 코리안넷에서 바코드 13자리 숫자를 검색해 제품명을 가져온다.
const request1 = new XMLHttpRequest();
request1.open("GET", koreannet, true);
request1.onreadystatechange = function () {
    koreannet_html = request1.responseText;
};
request1.send();

// 코리안넷 페이지의 html 데이터를 string에서 html document로 변환
const parser = new DOMParser();
const document2 = parser.parseFromString(koreannet_html, "text/html");
// 제품명을 가져옵니다.
let itemName = document2.getElementsByClassName("productTit")[0].innerText; // 바코드번호 + 제품명
itemName = itemName.slice(14); // 바코드번호는 제외하고 제품명만 검색하도록 한다.

// 상품정보시스템 링크
let productInfo = `https://www.g2b.go.kr:8053/search/unifiedSearch.do?pageNumber=1&sortBy=&ascDesc=&displayType=0001&resultSearchYn=&searchTarget=total&searchWord=${itemName}`;
let productInfo_html; // 상품정보시스템 페이지 html 파일

// 2. 상품정보시스템에서 제품명을 검색해 물품목록번호(분류번호(8자리)-식별번호(8자리))를 가져온다.
const request2 = new XMLHttpRequest();
request2.open("GET", productInfo, true);
request2.onreadystatechange = function () {
    productInfo_html = request2.responseText;
};
request2.send();

// 상품정보시스템 통합검색 페이지의 html 데이터를 string에서 html document로 변환
const document3 = parser.parseFromString(productInfo_html, "text/html");

// 물품목록번호를 가져옵니다.
let listNum = document3.getElementsByClassName("labelNum")[0].innerText;
let nums = listNum.split("-");
let classNum = nums[0]; // 분류번호
let idNum = nums[1]; // 식별번호

let isGreen = false; // 녹색제품인지 확인하는 boolean 변수

// 3. 녹색정보시스템의 API 에서 가져온 식별번호나 분류번호가 존재하는지 확인하고 존재한다면 녹색제품으로 구분한다.
// 녹색정보시스템 API 데이터의 크기가 99081개로 너무 크기 때문에 1500개씩 67번 나눠서 확인합니다.
for (let i = 1; i < 68; i++) {
    // 이 API에 접속하기 위해서는 인증키가 필요한데 일단은 저 윤찬용 계정으로 승인을 받아 사용했습니다.
    fetch(
        `https://api.odcloud.kr/api/15087711/v1/uddi:aaf56d4c-2735-465a-bef3-9d341849dac4?page=${i}&perPage=1500&serviceKey=6P%2FeZUNmwaskW%2BtVdM1IoC6J0ZsJSjcVWcASJhYm%2BgDGgfqN0evLkICyz8bK57Kzbyf5aVJF17IFgCkXLEUNiw%3D%3D`
    )
        .then((response) => response.json())
        .then(function (data) {
            for (let j = 0; j < data.length; j++) {
                if (data[j].식별번호 == null && data[j].분류번호 == null) {
                    // 식별번호와 분류번호가 존재하지 않을 경우
                    continue;
                } else if (
                    data[j].식별번호 != null &&
                    idNum == data[j].식별번호
                ) {
                    // 식별번호를 우선적으로 비교합니다.
                    isGreen = true;
                } else if (
                    data[j].분류번호 != null &&
                    classNum == data[j].분류번호
                ) {
                    // 식별번호가 없으면 분류번호라도 비교합니다.
                    isGreen = true;
                }
            }
        })
        .catch((error) => {
            console.log("Error occurred: " + error);
        });
}

if (isGreen == true) {
    document.querySelector(".result green").textContent =
        "녹색제품이 맞습니다.";
} else {
    // 녹색제품이 아닌 경우 비슷한 카테고리의 녹색제품들을 추천해줍니다.
    document.querySelector(".result non_green").textContent =
        "녹색제품이 아닙니다.";
    recommendList();
}

function recommendList() {
    // 세부품목명을 저장한 변수
    let category =
        document3.getElementsByClassName("searchListConMid")[0].children[1]
            .innerText;
    category = category.slice(7, category.search("/") - 1).replace(/\s+/g, "");

    const list = document.querySelector(".recommand-list");
    for (let i = 1; i < 68; i++) {
        // 이 API에 접속하기 위해서는 인증키가 필요한데 일단은 저 윤찬용 계정으로 승인을 받아 사용했습니다.
        fetch(`https://api.odcloud.kr/api/15087711/v1/uddi:aaf56d4c-2735-465a-bef3-9d341849dac4?page=${i}&perPage=1500&serviceKey=6P%2FeZUNmwaskW%2BtVdM1IoC6J0ZsJSjcVWcASJhYm%2BgDGgfqN0evLkICyz8bK57Kzbyf5aVJF17IFgCkXLEUNiw%3D%3D
        `)
            .then((response) => response.json())
            .then(function (data) {
                for (let j = 0; j < data.length; j++) {
                    let x = data[j].제품용도명;
                    x = x.replace(/\s+/g, "");
                    if (x.includes(category)) {
                        // 비슷한 카테고리의 제품이 녹색제품으로 존재할 경우
                        const box = document.createElement("div");
                        const img = document.createElement("img");
                        const title = document.createElement("p");
                        const info = document.createElement("div");
                        const price = document.createElement("p");

                        box.setAttribute("class", "item_box");
                        box.onclick = "";
                        img.setAttribute("class", "item_img");
                        title.setAttribute("class", "item_title");
                        info.setAttribute("class", "item_info");

                        let simItem = data[j].모델명;
                        let recItems = `https://search.shopping.naver.com/search/all?where=all&frm=NVSCTAB&query=${simItem}`;
                        let recItems_html;
                        // 찾은 녹색제품을 판매하는 네이버 쇼핑 페이지를 긁어옵니다.
                        const request3 = new XMLHttpRequest();
                        request3.open("GET", recItems, true);
                        request3.onreadystatechange = function () {
                            recItems_html = request3.responseText;
                        };
                        request3.send();
                        const document4 = parser.parseFromString(
                            recItems_html,
                            "text/html"
                        );

                        let naverItem = document4.getElementsByClassName(
                            "thumbnail_thumb__3Agq6"
                        )[0];
                        img.src = naverItem.firstChild.src; // 녹색제품 이미지
                        img.href = naverItem.href; // 녹색제품 구매 링크 (이미지를 클릭하면 구매 링크로 이동)
                        title.textContent = naverItem.firstChild.alt;
                        price.textContent =
                            document4.getElementsByClassName(
                                "price_num__2WUXn"
                            )[0].innerText;

                        list.appendChild(box);
                        box.appendChild(img);
                        box.appendChild(title);
                        box.appendChild(info);
                        info.appendChild(price);
                    }
                }
            })
            .catch((error) => {
                console.log("Error occurred: " + error);
            });
    }
}

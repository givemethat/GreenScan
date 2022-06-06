const express = require("express");
const sqlite3 = require("sqlite3");
const sqlite = require("sqlite");
const cheerio = require("cheerio");
const request = require("request");

const app = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

async function getDB(name) {
    const db = await sqlite.open({
        filename: name,
        driver: sqlite3.Database,
    });
    return db;
}

app.get("/", async function (req, res) {
    res.render("index.ejs");
});

app.get("/barcode", async function (req, res) {
    res.render("barcode.ejs");
});

app.get("/search", async function (req, res) {
    res.render("search.ejs");
});

app.post("/barcodeShopping", async function (req, res) {
    let barcode = req.body.barcodeNum;
    let url = `http://www.koreannet.or.kr/home/hpisSrchGtin.gs1?gtin=${barcode}`;
    request(url, function (err, res1, html) {
        if (err) console.error(err);
        let $ = cheerio.load(html);
        let fullName = $(".productTit").text().trim().slice(14);
        let name = fullName.trim().split(" ")[1];
        let url = `http://www.g2b.go.kr:8053/search/unifiedSearch.do?pageNumber=1&sortBy=&ascDesc=&displayType=0001&resultSearchYn=&searchTarget=total&searchWord=${name}`;
        request(encodeURI(url), async function (err, res2, html) {
            if (err) console.error(err);
            let $ = cheerio.load(html);
            let arr = $(".labelNum").first().text().split("-");
            let classNum = arr[0];
            let idNum = arr[1];
            let db = await getDB("greenProduct.db");
            let query = `select * from greenProduct where 식별번호 == ${idNum}`;
            let rows = await db.all(query);
            let isGreen = rows.length > 0;
            let queryForGreens = `select * from greenProduct where 분류번호 == ${classNum}`;
            let greenItems = await db.all(queryForGreens);
            res.render("shopping.ejs", {
                name: fullName,
                isGreen: isGreen,
                greenItems: greenItems
            });
        });
    });
});

app.post("/searchShopping", async function (req, res) {
    let name = req.body.productName;
    let url = `http://www.g2b.go.kr:8053/search/unifiedSearch.do?pageNumber=1&sortBy=&ascDesc=&displayType=0001&resultSearchYn=&searchTarget=total&searchWord=${name}`;
    request(encodeURI(url), async function (err, res2, html) {
        if (err) console.error(err);
        let $ = cheerio.load(html);

        let arr = $(".labelNum").first().text().split("-");
        let classNum = arr[0];
        let idNum = arr[1];
        let db = await getDB("greenProduct.db");
        let query = `select * from greenProduct where 식별번호 == ${idNum}`;
        let rows = await db.all(query);
        let isGreen = rows.length > 0;
        let queryForGreens = `select * from greenProduct where 분류번호 == ${classNum}`;
        let greenItems = await db.all(queryForGreens);
        res.render("shopping.ejs", {
            name: name,
            isGreen: isGreen,
            greenItems: greenItems
        });
    });
});

app.get("/map", async function (req, res) {
    res.render("map.ejs");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("서버가 실행됐습니다.");
    console.log(`서버주소: http://localhost:${PORT}`);
});

const express = require("express");
const sqlite3 = require("sqlite3");
const sqlite = require("sqlite");
const { acceptsLanguages } = require("express/lib/request");

const app = express();

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

app.get("/map", async function (req, res) {
    res.render("map.ejs");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("서버가 실행됐습니다.");
    console.log(`서버주소: http://localhost:${PORT}`);
});

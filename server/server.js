const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());

const matavimaiQ = "SELECT matavimas, x, y FROM matavimai ORDER BY matavimas";

const stiprumaiQ =
  'SELECT CONCAT("[", GROUP_CONCAT(stiprumas), "]") AS stiprumai FROM stiprumai GROUP BY matavimas ORDER BY matavimas, sensorius';

const macIrStiprumaiQ =
  'SELECT mac, CONCAT("[", GROUP_CONCAT(stiprumas), "]") AS stiprumai FROM vartotojai GROUP BY mac ORDER BY mac, sensorius';

const pool = mysql.createConnection({
  user: "stud",
  password: "vLXCDmSG6EpEnhXX",
  database: "LDB",
  host: "seklys.ila.lt",
  waitForConnections: true,
});

const promisePool = pool.promise();

app.get("/get-db", async (req, res) => {
  const matavimai = await promisePool.query(matavimaiQ).then((val) => val[0]);
  const stiprumai = await promisePool
    .query(stiprumaiQ)
    .then((val) => val[0].map((a) => JSON.parse(a.stiprumai)));
  const macIrStiprumai = await promisePool
    .query(macIrStiprumaiQ)
    .then((val) => val[0]);

  res.send({ matavimai, stiprumai, macIrStiprumai });
});

app.listen(3333, () => {
  console.log("Express server listening at port: 3333");
});

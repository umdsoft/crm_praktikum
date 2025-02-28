require("dotenv").config({ path: ".env" });
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const os = require("os");
const cluster = require("cluster");

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(
  compression({
    level: 6,
    threshold: 10 * 1000,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Frontend’larning kelib chiqishlari (origins)
const allowedOrigins = [
  'https://target.umdsoft.uz', // Birinchi frontend domeni
  'https://umdsoft.uz', // Ikkinchi frontend domeni
  'http://localhost:3000', // Lokal sinov uchun
];

// CORS sozlamalari
const corsOptions = {
  origin: (origin, callback) => {
    // Agar origin ruxsat etilgan bo‘lsa
    if (allowedOrigins.includes(origin) || !origin) { // !origin lokal sinovlar uchun
      callback(null, true);
    } else {
      callback(new Error('CORS xatosi: Ruxsat etilmagan kelib chiqish'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Agar cookie yoki auth token ishlatilsa
  optionsSuccessStatus: 200, // IE uchun
};

app.use(cors(corsOptions));
app.use(morgan("tiny"));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/api", require("./router/index"));


  app.listen(3001, () => {
    console.log(`Server 3111 is running`);
  });

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
const allowedOrigins = [
  'http://localhost:3000', // Development
  'http://localhost:5173', // Development
  'https://umdsoft.uz', // Production domain 1
  'https://target.umdsoft.uz', // Production domain 2
  // Add more domains as needed
];
// Universal CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., Postman, curl, or server-to-server requests)
    // You can remove this if you only want to allow browser requests
    if (!origin) {
      return callback(null, true);
    }

    // Check if the origin is in the whitelist
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow credentials (cookies, auth headers, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  optionsSuccessStatus: 200, // For legacy browsers that choke on 204
};

// Apply CORS middleware to all routes
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests for all routes
app.options('*', cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("tiny"));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/api", require("./router/index"));


  app.listen(3001, () => {
    console.log(`Server 3111 is running`);
  });

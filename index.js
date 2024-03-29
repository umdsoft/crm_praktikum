require("dotenv").config({ path: ".env" });
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      plugins: [
        {
          fn: (system) => {
            // Add the authorization header button to Swagger-UI
            return {
              components: {
                authorizeContent: {
                  // Customize as needed
                  "application/json": {
                    example: "Bearer YOUR_ACCESS_TOKEN",
                  },
                },
                authorizeOperation: {
                  // Customize the authorize button text
                  title: "Authorize",
                },
              },
            };
          },
          state: {},
        },
      ],
    },
  })
);

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(morgan("tiny"));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/api", require("./router/index"));
app.listen(5002, () => {
  console.log("run server");
});

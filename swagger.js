const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "Green Project API for education | Praktikum Academy",
    description: "Green Project API for education | Praktikum Academy",
  },
  host: "localhost:5000",
  securityDefinitions: {
    apiKeyAuth: {
      type: 'apiKey',
      in: 'header', // can be 'header', 'query' or 'cookie'
      name: 'Bearer', // name of the header, query parameter or cookie
      description: 'Some description...'
    }
  }
};

const outputFile = "./swagger-output.json";
const routes = ["./index.js"];

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the 
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

swaggerAutogen(outputFile, routes, doc).then(() => {
  require("./index.js");
});

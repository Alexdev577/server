// project import
const http = require("http");
const app = require("./app");
const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

// listen to server on available port
server.listen(PORT, () => {
  console.log(`Server Is running at ${PORT}`);
});

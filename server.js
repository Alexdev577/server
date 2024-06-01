// project import
const http = require("http");
const app = require("./app");
const server = http.createServer(app);

// server running at 8000
server.listen(8080, () => {
  console.log(`Server Is running at 8000`);
});

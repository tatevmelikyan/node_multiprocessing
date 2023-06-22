import http from "http";
import CSVConverter from "../worker-threads/parent.js";
import fs from "fs";
import path from "path";

const server = http.createServer((req, res) => {
  const requestUrl = req.url;
  const method = req.method;
  if (requestUrl === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Home");
  } else if (requestUrl === "/exports" && method === "POST") {
    let reqBody = "";
    req.on("data", (chunk) => {
      reqBody += chunk;
    });
    req.on("end", async () => {
      const dirPath = reqBody;
      const csvConverter = new CSVConverter(dirPath);
      await csvConverter.convert();
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(`All converted files are saved in the 'converted' folder.`);
    });
  } else if (requestUrl === "/files" && method === "GET") {
    fs.readdir("converted", (err, files) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(`Failed to read directory. ${err}`);
      }
      files.map((file) => {
        res.write(file + ",\n");
      });
      res.statusCode = 200;
      res.end("Files received successfully!");
    });
  } else if (requestUrl.startsWith("/files/") && method === "GET") {
    const fileName = requestUrl.split("/")[2];
    const filePath =
      path.resolve("converted", decodeURIComponent(fileName)) + ".json";
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(`Failed to read file. ${err}`);
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(data);
    });
  } else if (requestUrl.startsWith("/files/") && method === "DELETE") {
    const fileName = requestUrl.split("/")[2];
    const filePath =
      path.resolve("converted", decodeURIComponent(fileName)) + ".json";
    fs.unlink(filePath, (err) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(`Failed to delete file. ${err}`);
      }
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("File deleted successfully.");
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Page not found");
  }
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});

import { parentPort } from "worker_threads";
import { createReadStream } from "fs";
import { writeFile } from "fs/promises";
import csv from "csv-parser";
import path from "path";

async function parseCSV(fileToParse, convertedDirPath) {
  const startTime = new Date();
  const results = [];
  createReadStream(fileToParse)
    .pipe(csv())
    .on("data", (data) => {
      results.push(data);
    })
    .on("end", async () => {
      const endTime = new Date();
      const duration = endTime - startTime;
      const parsedData = JSON.stringify(results);
      console.log(
        `Filename: ${path.parse(fileToParse).name}, Parsed: ${
          results.length
        }, duration: ${duration}ms`
      );
      try {
        const fileName = path.parse(path.basename(fileToParse)).name + ".json";
        const convertedFilePath = path.join(convertedDirPath, fileName);
        await writeFile(convertedFilePath, parsedData);
        process.exit();
      } catch (err) {
        console.error(err.message);
      }
    });
}

parentPort.on("message", (msg) => {
  const { filesToParse, convertedDirPath } = msg;
  filesToParse.forEach((file) => {
    parseCSV(file, convertedDirPath);
  });
});

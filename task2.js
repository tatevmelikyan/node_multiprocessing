import cluster from "node:cluster";
import { existsSync, createReadStream } from "fs";
import { availableParallelism } from "node:os";
import process from "node:process";
import csv from "csv-parser";
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

async function createAdjacentDir(directory) {
  try {
    await mkdir(directory);
  } catch (err) {
    console.error(err.message);
  }
}

async function parseCSV(directory) {
  if (!directory) {
    throw new Error("No directory received.");
  }
  const absoluteDirPath = path.resolve(directory);
  const dirname = path.dirname(absoluteDirPath);
  const convertedDirPath = path.join(dirname, "converted");
  if (!existsSync(convertedDirPath)) {
    await createAdjacentDir(convertedDirPath);
  }
  const numCPUs = availableParallelism();
  let files;
  try {
    files = await readdir(absoluteDirPath);
  } catch (err) {
    console.error(err);
  }
  if (cluster.isPrimary) {
    const numFiles = files.length;
    const numWorkers = Math.min(numFiles, numCPUs);
    const filesPerWorker = Math.floor(numFiles / numWorkers);
    for (let i = 0; i < numWorkers; i++) {
      const worker = cluster.fork();
      const filesToParse = files.splice(0, filesPerWorker);
      setTimeout(() => {
        worker.send(filesToParse);
      }, 1000);
    }
  } else {
    const workerStarted = Date.now();
    process.on("message", (files) => {
      files.forEach((file) => {
        const filePath = path.join(absoluteDirPath, file);
        parseFile(filePath, convertedDirPath);
      });
    });
    const workerFinished = Date.now();
    console.log(
      `Worker ${process.pid} took ${
        workerFinished - workerStarted
      } ms to parse ${files.length} files`
    );
  }
}

async function parseFile(filePath, convertedDirPath) {
  const results = [];
  createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      const parsedData = JSON.stringify(results);
      try {
        const fileName = path.parse(path.basename(filePath)).name + ".json";
        const convertedFilePath = path.join(convertedDirPath, fileName);
        await writeFile(convertedFilePath, parsedData);
      } catch (err) {
        console.error(err.message);
      }
    });
}

const arg = process.argv.slice(2)[0];
await parseCSV(arg);

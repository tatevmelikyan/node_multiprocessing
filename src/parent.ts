import path from "node:path";
import { readdir } from "node:fs/promises";
import { Worker } from "worker_threads";
import { availableParallelism } from "node:os";
import { existsSync, mkdirSync } from "node:fs";

class CSVConverter {
  csvDirPath: string;

  constructor(csvDirPath: string) {
    if (!csvDirPath) {
      throw new Error("Directory path not provided");
    }
    this.csvDirPath = csvDirPath;
  }

  createConvertedDir() {
    const absoluteDirPath = path.resolve(this.csvDirPath);
    const dirname = path.dirname(absoluteDirPath);
    const convertedDirPath = path.join(dirname, "converted");
    if (!existsSync(convertedDirPath)) {
      mkdirSync(convertedDirPath);
    }
    return convertedDirPath;
  }

  async convert() {
    try {
      const files = (await readdir(this.csvDirPath)).map((file) =>
        path.join(this.csvDirPath, file)
      );
      await this.createWorkers(files);
    } catch (err) {
      console.error(err);
    }
  }

  async createWorkers(files: string[]) {
    const convertedDirPath = this.createConvertedDir();
    const numFiles = files.length;
    const numCPUs = availableParallelism();
    const numWorkers = Math.min(numFiles, numCPUs, 10);
    const filesPerWorker = Math.floor(numFiles / numWorkers);
    let remainingFiles = numFiles % numWorkers;

    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker("./dist/child.js");
      let removeCount = filesPerWorker;
      if (remainingFiles > 0) {
        removeCount += 1;
        remainingFiles -= 1;
      }
      const filesToParse = files.splice(0, removeCount);
      worker.on("online", () => {
        worker.postMessage({ convertedDirPath, filesToParse });
      });
    }
  }
}

// const csvConverter = new CSVConverter("csv-files");
// await csvConverter.convert();
export default CSVConverter;

import { spawn } from "child_process";
import { writeFile } from "fs";

function getProcessStats(command, args = [], timeout) {
  const statistics = {
    startTime: new Date(),
    success: false,
  };

  const childProcess = spawn(command, args, { timeout });

  childProcess.on("spawn", () => {
    statistics.success = true;
  });

  childProcess.on("error", (err) => {
    statistics.commandSuccess = false;
    statistics.error = err.message;
  });

  childProcess.on("close", (code, signal) => {
    const endTime = new Date();
    statistics.duration = endTime - statistics.startTime + "ms";
    if (signal === "SIGTERM") {
      const message = "Timeout exceeded";
      console.log(message);
      statistics.success = false;
      statistics.error = message;
    }
    saveStats(statistics, command);
  });
}

function saveStats(statistics, command) {
  const timestamp = statistics.startTime.toISOString().replace(/:/g, "-");
  const filePath = `./logs/${timestamp}${command}.json`;
  const data = JSON.stringify(statistics);
  writeFile(filePath, data, (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log("File written successfully");
      console.log("Statistics: ", statistics);
    }
  });
}

getProcessStats("node", ["-v"]);

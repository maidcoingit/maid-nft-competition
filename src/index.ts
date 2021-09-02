import fs from "fs";
import { User } from "./types";

const result = JSON.parse(fs.readFileSync("result.json", "utf-8"));
let winner: User;

for (const id of Object.keys(result)) {
    if (!winner || winner.points < result[id].points) {
        winner = result[id];
    }
}

console.log(winner);


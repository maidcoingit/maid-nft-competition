import fs from "fs";
import { UserV2TimelineResult } from "twitter-api-v2";
import client from "./client";
import { USER_ID } from "./constants";
import sleep from "./sleep";

const writeFollowers = (result: UserV2TimelineResult, original) => {
    console.log("writing " + result.data.length + " new followers");
    const reduced = result.data.reduce((prev, current) => {
        prev[current.id] = {
            id: current.id,
            name: current.name,
            username: current.username,
        };
        return prev;
    }, original.data);
    const newData = {
        data: reduced,
        next_token: result.meta.next_token,
    };
    fs.writeFileSync("followers.json", JSON.stringify(newData, null, 4), "utf-8");
    return newData;
};

const fetchFollowers = async () => {
    let data = JSON.parse(fs.readFileSync("followers.json", "utf-8"));
    let result = await client.v2.followers(USER_ID, {
        max_results: 100,
        pagination_token: data.next_token || undefined,
    });
    data = writeFollowers(result, data);
    while (result.data.length > 0) {
        const next = result.meta.next_token;
        if (next) {
            await sleep(60 * 1000);
            result = await client.v2.followers(USER_ID, {
                max_results: 100,
                pagination_token: next,
            });
            data = writeFollowers(result, data);
        } else {
            break;
        }
    }
};

fetchFollowers();

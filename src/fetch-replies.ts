import fs from "fs";
import { TweetV1 } from "twitter-api-v2";
import client from "./client";
import sleep from "./sleep";

const fetchReplies = async () => {
    const replies: TweetV1[] = [];
    let result = await client.v1.get("tweets/search/fullarchive/dev.json", {
        query: "(to:maid_coin)",
        maxResults: "100",
        fromDate: "202106110000",
    });
    console.log(result);
    while (result.results?.length > 0) {
        console.log("fetching " + result.results?.length + " tweets");
        replies.push(...result.results);
        const next = result.next;
        if (next) {
            await sleep(2000);
            result = await client.v1.get("tweets/search/fullarchive/dev.json", {
                query: "(to:maid_coin)",
                maxResults: "100",
                fromDate: "202106110000",
                next,
            });
        } else {
            break;
        }
    }
    fs.writeFileSync("replies.json", JSON.stringify(replies, null, 4), "utf-8");
};

fetchReplies();

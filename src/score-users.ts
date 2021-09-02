import fs from "fs";
import { TweetV2 } from "twitter-api-v2";
import client from "./client";
import { USER_ID } from "./constants";
import sleep from "./sleep";
import { User } from "./types";

const data = JSON.parse(fs.readFileSync("followers.json", "utf-8")).data;
const followers = Object.keys(data).reduce(
    (prev, current) =>
        ({
            ...prev,
            [current]: {
                ...data[current],
                likes: 0,
                retweets: 0,
                tags: 0,
                points: 1,
            },
        } as User),
    {}
);

const filter = data => {
    return data.filter(tweet => tweet.in_reply_to_user_id == USER_ID && tweet.text.includes("MAID NFT #"));
};

const fetchTweets = async () => {
    const tweets: TweetV2[] = [];
    let result = await client.v2.userTimeline(USER_ID, {
        "tweet.fields": ["in_reply_to_user_id", "conversation_id", "created_at"],
        max_results: 100,
    });
    tweets.push(...filter(result.data.data));
    await sleep(600);
    result = await result.next(100);
    tweets.push(...filter(result.data.data));

    return tweets;
};

const updateLikes = async (tweets: TweetV2[]) => {
    for (const tweet of tweets) {
        const likes = await client.v2.tweetLikedBy(tweet.id);
        for (const like of likes.data) {
            if (followers[like.id]) {
                followers[like.id].likes += 1;
                followers[like.id].points += 1;
                console.log(`${like.username} liked '${tweet.text.split("\n")[0]}'`);
            }
        }
        await sleep(12000);
    }
};

const updateRetweets = async (tweets: TweetV2[]) => {
    for (const tweet of tweets) {
        const retweets = await client.v2.tweetRetweetedBy(tweet.id);
        for (const retweet of retweets.data) {
            if (followers[retweet.id]) {
                followers[retweet.id].retweets += 1;
                followers[retweet.id].points += 1;
                console.log(`${retweet.username} retweeted '${tweet.text.split("\n")[0]}'`);
            }
        }
        await sleep(3000);
    }
};

const updateReplies = async (tweets: TweetV2[]) => {
    const replies = JSON.parse(fs.readFileSync("replies.json", "utf-8"));
    for (const tweet of tweets) {
        for (const reply of replies) {
            if (reply.in_reply_to_status_id_str == tweet.id) {
                if (followers[reply.user.id_str]) {
                    const matched = [...reply.text.matchAll(/@[a-zA-z0-9_]+[\s\n]/g)];
                    if (matched.length > 1) {
                        const point = matched.length - 1;
                        followers[reply.user.id_str].tags += point;
                        followers[reply.user.id_str].points += point;
                        console.log(
                            `${followers[reply.user.id_str].username} tagged ${matched
                                .join("")
                                .replace(/[\s]/g, "")} to ${tweet.text.split("\n")[0]}`
                        );
                    }
                }
            }
        }
    }
};

const scoreUsers = async () => {
    const tweets = await fetchTweets();
    await Promise.all([updateLikes(tweets), updateRetweets(tweets), updateReplies(tweets)]);
    fs.writeFileSync("result.json", JSON.stringify(followers, null, 4), "utf-8");
};
scoreUsers();

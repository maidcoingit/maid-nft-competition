import TwitterApi from "twitter-api-v2";
import dotenv from "dotenv";
dotenv.config();

const twitterClient = new TwitterApi(process.env.BEAR_TOKEN);
const client = twitterClient.readOnly;
export default client;

import {
  AvailableIntentsEventsEnum,
  createOpenAPI,
  createWebsocket,
  Embed,
  IMessage,
} from "qq-guild-bot";
import { config } from "./config";
require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");

const botConfig = {
  appID: config.appID, // 申请机器人时获取到的机器人 BotAppID
  token: config.token, // 申请机器人时获取到的机器人 BotToken
  intents: [AvailableIntentsEventsEnum.GUILD_MESSAGES], // 事件订阅,用于开启可接收的消息类型
  sandbox: false, // 沙箱支持，可选，默认false. v2.7.0+
};

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  organization: "org-bZZb4VefPttQAejfrVcVgfmm",
});

const openai = new OpenAIApi(configuration);

// 创建 client
const client = createOpenAPI(botConfig);
// 创建 websocket 连接
const ws = createWebsocket(botConfig);

async function getAnswer(question: string) {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: question }],
    temperature: 0.6,
    max_tokens: 100,
    top_p: 1,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
  });
  return response.data.choices[0].message.content;
}

async function sendAnswer(
  question: string,
  channelId: string,
  messageId: string
) {
  client.messageApi
    .postMessage(channelId, {
      content: await getAnswer(question),
      msg_id: messageId,
    })
    .then((res) => {
      console.log(res.data);
    })
    .catch((err) => {
      console.log(err);
    });
}

// 注册用户 at 机器人消息事件
ws.on(AvailableIntentsEventsEnum.GUILD_MESSAGES, (data: { msg: IMessage }) => {
  const content = data.msg.content.split(" ");
  const question = content.slice(1).toString().replace(/,/g, " ");
  if (question.length > 0) {
    sendAnswer(question, data.msg.channel_id, data.msg.id);
  }
});

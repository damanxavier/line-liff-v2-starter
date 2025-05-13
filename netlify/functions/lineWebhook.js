// netlify/functions/lineWebhook.js

const crypto = require("crypto");

exports.handler = async (event) => {
  const body = event.body;
  const signature = event.headers["x-line-signature"];
  const channelSecret = process.env.LINE_CHANNEL_SECRET;

  // Validate LINE signature (optional but recommended)
  const hash = crypto
    .createHmac("SHA256", channelSecret)
    .update(body)
    .digest("base64");

  if (hash !== signature) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  const webhookEvent = JSON.parse(body);

  // Loop through events
  for (const evt of webhookEvent.events) {
    console.log("Received LINE event:", evt);

    if (evt.type === "message" && evt.message.type === "text") {
      const replyToken = evt.replyToken;
      const userMessage = evt.message.text;

      await sendReply(replyToken, `You said: ${userMessage}`);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Webhook handled" }),
  };
};

async function sendReply(replyToken, replyMessage) {
  const axios = require("axios");
  const channelAccessToken = process.env.LINE_ACCESS_TOKEN;

  const body = {
    replyToken: replyToken,
    messages: [
      {
        type: "text",
        text: replyMessage,
      },
    ],
  };

  await axios.post("https://api.line.me/v2/bot/message/reply", body, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
    },
  });
}


import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";
const apiId = parseInt(process.env.TELEGRAM_API_ID || "0");
const apiHash = process.env.TELEGRAM_API_HASH || "";
async function generateSession() {
    const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
        connectionRetries: 5,
    });
    await client.start({
        phoneNumber: async () => await input.text("Enter your phone number: "),
        password: async () => await input.text("Enter your password: "),
        phoneCode: async () => await input.text("Enter the code you received: "),
        onError: (err) => console.log(err),
    });
    console.log("Session string:");
    console.log(client.session.save());
    await client.disconnect();
}
generateSession();
//# sourceMappingURL=generate-session.js.map
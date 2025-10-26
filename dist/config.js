export const config = {
    telegram: {
        apiId: parseInt(process.env.TELEGRAM_API_ID || "0"),
        apiHash: process.env.TELEGRAM_API_HASH || "",
        sessionString: process.env.TELEGRAM_SESSION || "",
    },
};
//# sourceMappingURL=config.js.map
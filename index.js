const { Client, GatewayIntentBits } = require("discord.js");
const http = require("http");

const TOKEN = process.env.TOKEN;
const PORT = process.env.PORT || 10000;

if (!TOKEN) {
    console.error("❌ TOKEN غير موجود");
    process.exit(1);
}

http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Rase Bot");
}).listen(PORT, "0.0.0.0", () => {
    console.log("🌐 Render OK");
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
    console.log("================================");
    console.log("✅ RASE BOT CONNECTED");
    console.log("🤖 " + client.user.tag);
    console.log("================================");
});

client.on("error", (error) => {
    console.error("❌ DISCORD ERROR");
    console.error(error);
});

console.log("🔵 STARTING DISCORD LOGIN...");

client.login(TOKEN)
    .then(() => {
        console.log("🟢 LOGIN SUCCESS");
    })
    .catch((error) => {
        console.error("🔴 LOGIN FAILED");
        console.error(error);
    });

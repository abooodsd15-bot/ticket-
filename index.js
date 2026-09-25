```js
// ==============================
// توكن البوت
// ==============================

const TOKEN = "حط_التوكن_هنا";

// ==============================
// Discord.js
// ==============================

const {
    Client,
    GatewayIntentBits,
    Partials,
    ChannelType,
    PermissionsBitField,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    REST,
    Routes,
    SlashCommandBuilder
} = require("discord.js");

// ==============================
// Render Port
// ==============================

const http = require("http");

const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Rase Bot is online!");
}).listen(PORT, "0.0.0.0", () => {
console.log("Web server running on port " + PORT);
});

// ==============================
// إعدادات البوت
// ==============================

const GUILD_ID = "1518005370612617326";
const TICKET_CATEGORY_ID = "";
const STAFF_ROLE_ID = "1518010146662518822";
const BOT_NAME = "Rase";

// ==============================
// إنشاء البوت
// ==============================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ],
    partials: [
        Partials.Channel
    ]
});

// ==============================
// أوامر السلاش
// ==============================

const commands = [
    new SlashCommandBuilder()
        .setName("setup-ticket")
        .setDescription("إرسال لوحة التكت الخاصة بـ Rase")
        .toJSON()
];

// ==============================
// عند تشغيل البوت
// ==============================

client.once("ready", async () => {

    console.log("");
    console.log("=================================");
    console.log(`     ${BOT_NAME} Ticket Bot`);
    console.log("=================================");
    console.log(`البوت يعمل باسم: ${client.user.tag}`);
    console.log(`عدد السيرفرا
```

* `STAFF_ROLE_ID` = أيدي رتبة الإدارة.
* `TICKET_CATEGORY_ID` = تقدر تتركه فارغًا، والكود ينشئ `Rase Tickets` تلقائيًا.

**مهم:** إذا وضعت التوكن الحقيقي في هذا الملف، لا ترسل الكود لي ولا ترفعه إلى GitHub.

```js
// ==============================
// توكن البوت
// ==============================

const TOKEN = "MTU1MzAzOTIwMjE2ODYwNjgwMQ.GoHB_A.1d4U6uNiqEZRvjW5YF0jlSrSxwevcX-aJ21RUQ";

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
    console.log(`Web server running on port ${PORT}`);
});

// ==============================
// إعدادات البوت
// ==============================

const GUILD_ID = "1518005370612617326";
const TICKET_CATEGORY_ID = "";
const STAFF_ROLE_ID = "1518010146662518822";
const BOT_NAME = "Rase";

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
    console.log(`عدد السيرفرات: ${client.guilds.cache.size}`);
    console.log("=================================");

    client.user.setPresence({
        activities: [
            {
                name: "Rase Tickets",
                type: 3
            }
        ],
        status: "online"
    });

    try {

        const rest = new REST({
            version: "10"
        }).setToken(TOKEN);

        await rest.put(
            Routes.applicationGuildCommands(
                client.user.id,
                GUILD_ID
            ),
            {
                body: commands
            }
        );

        console.log("تم تسجيل أمر /setup-ticket بنجاح.");

    } catch (error) {

        console.error("خطأ في تسجيل الأمر:", error);

    }

});

// ==============================
// أمر إنشاء لوحة التكت
// ==============================

client.on("interactionCreate", async (interaction) => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName !== "setup-ticket") return;

    // التأكد أن المستخدم عنده صلاحية إدارة السيرفر

    if (
        !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator
        )
    ) {

        return interaction.reply({
            content: "❌ هذا الأمر للإدارة فقط.",
            ephemeral: true
        });

    }

    const embed = new EmbedBuilder()
        .setColor("#4b0d1a")
        .setTitle("🎫 Rase Ticket")
        .setDescription(
            "### مرحباً بك في نظام التذاكر\n\n" +
            "اختر نوع التذكرة المناسبة لك من القائمة بالأسفل.\n\n" +
            "🎭 **طلب رول**\n" +
            "لتقديم طلب للحصول على رول.\n\n" +
            "⚠️ **شكوى**\n" +
            "لتقديم شكوى للإدارة.\n\n" +
            "👑 **طلب ادمن**\n" +
            "للتواصل مع الإدارة بخصوص طلب إداري.\n\n" +
            "❓ **استفسار**\n" +
            "لأي استفسار أو مساعدة."
        )
        .setFooter({
            text: "Rase • Ticket System"
        })
        .setTimestamp();

    const menu = new StringSelectMenuBuilder()
        .setCustomId("rase_ticket_menu")
        .setPlaceholder("اختر نوع التكت...")
        .addOptions([

            {
                label: "طلب رول",
                description: "فتح تكت لطلب رول",
                value: "role_request",
                emoji: "🎭"
            },

            {
                label: "شكوى",
                description: "فتح تكت لتقديم شكوى",
                value: "complaint",
                emoji: "⚠️"
            },

            {
                label: "طلب ادمن",
                description: "فتح تكت لطلب إداري",
                value: "admin_request",
                emoji: "👑"
            },

            {
                label: "استفسار",
                description: "فتح تكت للاستفسار",
                value: "inquiry",
                emoji: "❓"
            }

        ]);

    const row = new ActionRowBuilder()
        .addComponents(menu);

    await interaction.channel.send({
        embeds: [embed],
        components: [row]
    });

    await interaction.reply({
        content: "✅ تم إرسال لوحة التكت.",
        ephemeral: true
    });

});

// ==============================
// اختيار نوع التكت
// ==============================

client.on("interactionCreate", async (interaction) => {

    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId !== "rase_ticket_menu") return;

    await interaction.deferReply({
        ephemeral: true
    });

    const guild = interaction.guild;
    const member = interaction.member;

    // أسماء التكتات

    const ticketNames = {

        role_request: "طلب-رول",
        complaint: "شكوى",
        admin_request: "طلب-ادمن",
        inquiry: "استفسار"

    };

    const ticketName = ticketNames[interaction.values[0]];

    // التأكد إذا عنده تكت مفتوح

    const existingTicket = guild.channels.cache.find(
        channel =>
            channel.type === ChannelType.GuildText &&
            channel.topic === `RaseTicket-${member.id}`
    );

    if (existingTicket) {

        return interaction.editReply({
            content: `❌ عندك تكت مفتوح بالفعل: ${existingTicket}`
        });

    }

    // البحث عن الكاتيجوري

    let category = null;

    if (TICKET_CATEGORY_ID) {

        category = guild.channels.cache.get(
            TICKET_CATEGORY_ID
        );

    }

    // إذا ما حددت كاتيجوري، يبحث عن Rase Tickets

    if (!category) {

        category = guild.channels.cache.find(
            channel =>
                channel.type === ChannelType.GuildCategory &&
                channel.name === "Rase Tickets"
        );

    }

    // إذا ما وجد الكاتيجوري ينشئ واحد

    if (!category) {

        category = await guild.channels.create({
            name: "Rase Tickets",
            type: ChannelType.GuildCategory
        });

    }

    // صلاحيات التكت

    const permissionOverwrites = [

        {
            id: guild.id,
            deny: [
                PermissionsBitField.Flags.ViewChannel
            ]
        },

        {
            id: member.id,
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.AttachFiles
            ]
        }

    ];

    // إضافة رتبة الإدارة

    if (
        STAFF_ROLE_ID &&
        guild.roles.cache.has(STAFF_ROLE_ID)
    ) {

        permissionOverwrites.push({

            id: STAFF_ROLE_ID,

            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.ManageChannels
            ]

        });

    }

    // إنشاء التكت

    const ticketChannel = await guild.channels.create({

        name: `${ticketName}-${member.user.username}`
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF-_]/g, "-")
            .slice(0, 90),

        type: ChannelType.GuildText,

        parent: category.id,

        topic: `RaseTicket-${member.id}`,

        permissionOverwrites: permissionOverwrites

    });

    // Embed داخل التكت

    const ticketEmbed = new EmbedBuilder()
        .setColor("#4b0d1a")
        .setTitle(`🎫 ${ticketName}`)
        .setDescription(
            `أهلاً ${member} 👋\n\n` +
            `تم فتح تذكرتك بنجاح.\n` +
            `يرجى كتابة طلبك بالتفصيل وانتظار رد الإدارة.\n\n` +
            `**نوع التذكرة:** ${ticketName}\n` +
            `**صاحب التذكرة:** ${member}\n\n` +
            `🔒 عند الانتهاء اضغط على زر **إغلاق التكت**.`
        )
        .setFooter({
            text: "Rase Ticket System"
        })
        .setTimestamp();

    // زر الإغلاق

    const closeButton = new ButtonBuilder()
        .setCustomId("rase_close_ticket")
        .setLabel("إغلاق التكت")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder()
        .addComponents(closeButton);

    await ticketChannel.send({

        content: `${member} ${
            STAFF_ROLE_ID
                ? `<@&${STAFF_ROLE_ID}>`
                : ""
        }`,

        embeds: [ticketEmbed],

        components: [row]

    });

    await interaction.editReply({

        content: `✅ تم إنشاء تكتك: ${ticketChannel}`

    });

});

// ==============================
// زر إغلاق التكت
// ==============================

client.on("interactionCreate", async (interaction) => {

    if (!interaction.isButton()) return;

    if (interaction.customId !== "rase_close_ticket") return;

    const channel = interaction.channel;

    // رسالة تأكيد

    const confirmEmbed = new EmbedBuilder()
        .setColor("#8b0000")
        .setTitle("🔒 إغلاق التكت")
        .setDescription(
            "هل أنت متأكد أنك تريد إغلاق هذه التذكرة؟"
        );

    const confirmButton = new ButtonBuilder()
        .setCustomId("rase_confirm_close")
        .setLabel("تأكيد الإغلاق")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
        .setCustomId("rase_cancel_close")
        .setLabel("إلغاء")
        .setEmoji("❌")
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder()
        .addComponents(
            confirmButton,
            cancelButton
        );

    await interaction.reply({

        embeds: [confirmEmbed],

        components: [row]

    });

});

// ==============================
// تأكيد إغلاق التكت
// ==============================

client.on("interactionCreate", async (interaction) => {

    if (!interaction.isButton()) return;

    if (interaction.customId === "rase_cancel_close") {

        await interaction.update({

            content: "✅ تم إلغاء إغلاق التكت.",

            embeds: [],

            components: []

        });

        return;

    }

    if (interaction.customId !== "rase_confirm_close") return;

    await interaction.update({

        content: "🔒 سيتم إغلاق التكت خلال 3 ثواني...",

        embeds: [],

        components: []

    });

    setTimeout(async () => {

        try {

            await interaction.channel.delete();

        } catch (error) {

            console.log(
                "تعذر حذف التكت:",
                error
            );

        }

    }, 3000);

});

// ==============================
// أخطاء البوت
// ==============================

process.on("unhandledRejection", error => {

    console.error(
        "Unhandled Rejection:",
        error
    );

});

process.on("uncaughtException", error => {

    console.error(
        "Uncaught Exception:",
        error
    );

});

// ==============================
// تسجيل الدخول
// ==============================

if (
    !TOKEN ||
    TOKEN === "حط_التوكن_هنا"
) {

    console.error(
        "❌ ضع توكن البوت في أعلى الملف."
    );

    process.exit(1);

}

client.login(TOKEN);
```

**مكان التوكن بالضبط:**

```js
const TOKEN = "حط_التوكن_هنا";
```

مثال شكلي فقط:

```js
const TOKEN = "توكن_البوت_هنا";
```

لا تستخدم المثال نفسه كتوكِن.

وباقي الإعدادات عندك كما هي:

* `GUILD_ID` = أيدي السيرفر.
* `STAFF_ROLE_ID` = أيدي رتبة الإدارة.
* `TICKET_CATEGORY_ID` = تقدر تتركه فارغًا، والكود ينشئ `Rase Tickets` تلقائيًا.

**مهم:** إذا وضعت التوكن الحقيقي في هذا الملف، لا ترسل الكود لي ولا ترفعه إلى GitHub.

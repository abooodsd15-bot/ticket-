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

http.createServer(function (req, res) {
    res.writeHead(200);
    res.end("Rase Bot is online!");
}).listen(PORT, "0.0.0.0", function () {
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

client.once("ready", async function () {

    console.log("");
    console.log("=================================");
    console.log("     " + BOT_NAME + " Ticket Bot");
    console.log("=================================");
    console.log("البوت يعمل باسم: " + client.user.tag);
    console.log("عدد السيرفرات: " + client.guilds.cache.size);
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

client.on("interactionCreate", async function (interaction) {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName !== "setup-ticket") return;

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

client.on("interactionCreate", async function (interaction) {

    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId !== "rase_ticket_menu") return;

    await interaction.deferReply({
        ephemeral: true
    });

    const guild = interaction.guild;
    const member = interaction.member;

    const ticketNames = {
        role_request: "طلب-رول",
        complaint: "شكوى",
        admin_request: "طلب-ادمن",
        inquiry: "استفسار"
    };

    const ticketName = ticketNames[interaction.values[0]];

    const existingTicket = guild.channels.cache.find(function (channel) {

        return (
            channel.type === ChannelType.GuildText &&
            channel.topic === "RaseTicket-" + member.id
        );

    });

    if (existingTicket) {

        return interaction.editReply({
            content: "❌ عندك تكت مفتوح بالفعل: " + existingTicket
        });

    }

    let category = null;

    if (TICKET_CATEGORY_ID) {

        category = guild.channels.cache.get(
            TICKET_CATEGORY_ID
        );

    }

    if (!category) {

        category = guild.channels.cache.find(function (channel) {

            return (
                channel.type === ChannelType.GuildCategory &&
                channel.name === "Rase Tickets"
            );

        });

    }

    if (!category) {

        category = await guild.channels.create({
            name: "Rase Tickets",
            type: ChannelType.GuildCategory
        });

    }

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

    const safeUsername = member.user.username
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF-_]/g, "-")
        .slice(0, 90);

    const ticketChannel = await guild.channels.create({

        name: ticketName + "-" + safeUsername,

        type: ChannelType.GuildText,

        parent: category.id,

        topic: "RaseTicket-" + member.id,

        permissionOverwrites: permissionOverwrites

    });

    const ticketEmbed = new EmbedBuilder()
        .setColor("#4b0d1a")
        .setTitle("🎫 " + ticketName)
        .setDescription(
            "أهلاً " + member + " 👋\n\n" +
            "تم فتح تذكرتك بنجاح.\n" +
            "يرجى كتابة طلبك بالتفصيل وانتظار رد الإدارة.\n\n" +
            "**نوع التذكرة:** " + ticketName + "\n" +
            "**صاحب التذكرة:** " + member + "\n\n" +
            "🔒 عند الانتهاء اضغط على زر **إغلاق التكت**."
        )
        .setFooter({
            text: "Rase Ticket System"
        })
        .setTimestamp();

    const closeButton = new ButtonBuilder()
        .setCustomId("rase_close_ticket")
        .setLabel("إغلاق التكت")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder()
        .addComponents(closeButton);

    let staffMention = "";

    if (STAFF_ROLE_ID) {
        staffMention = "<@&" + STAFF_ROLE_ID + ">";
    }

    await ticketChannel.send({

        content: member + " " + staffMention,

        embeds: [ticketEmbed],

        components: [row]

    });

    await interaction.editReply({

        content: "✅ تم إنشاء تكتك: " + ticketChannel

    });

});

// ==============================
// زر إغلاق التكت
// ==============================

client.on("interactionCreate", async function (interaction) {

    if (!interaction.isButton()) return;

    if (interaction.customId !== "rase_close_ticket") return;

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

client.on("interactionCreate", async function (interaction) {

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

    setTimeout(async function () {

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

process.on("unhandledRejection", function (error) {

    console.error(
        "Unhandled Rejection:",
        error
    );

});

process.on("uncaughtException", function (error) {

    console.error(
        "Uncaught Exception:",
        error
    );

});

// ==============================
// تسجيل الدخول
// ==============================

if (!TOKEN || TOKEN === "حط_التوكن_هنا") {

    console.error(
        "❌ ضع توكن البوت في أعلى الملف."
    );

    process.exit(1);

}

client.login(TOKEN);

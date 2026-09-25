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

const http = require("http");

// ==============================
// إعدادات البوت
// ==============================

const TOKEN = "MTU1MzAzOTIwMjE2ODYwNjgwMQ.GoHB_A.1d4U6uNiqEZRvjW5YF0jlSrSxwevcX-aJ21RUQ";

const GUILD_ID = "1518005370612617326";

const STAFF_ROLE_ID = "1518010146662518822";

const TICKET_CATEGORY_ID = "";

const PORT = process.env.PORT || 10000;

// ==============================
// Render Web Server
// ==============================

http.createServer(function (req, res) {
    res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8"
    });

    res.end("Rase Bot is online!");
}).listen(PORT, "0.0.0.0", function () {
    console.log("Web server running on port " + PORT);
});

// ==============================
// إنشاء البوت
// ==============================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ],
    partials: [
        Partials.Channel
    ]
});

// ==============================
// أمر السلاش
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

    console.log("=================================");
    console.log("Rase Ticket Bot");
    console.log("Bot: " + client.user.tag);
    console.log("Servers: " + client.guilds.cache.size);
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

        console.log("تم تسجيل /setup-ticket بنجاح.");

    } catch (error) {

        console.error("خطأ في تسجيل الأمر:");
        console.error(error);

    }

});

// ==============================
// جميع التفاعلات
// ==============================

client.on("interactionCreate", async function (interaction) {

    try {

        // ==========================
        // أمر Setup Ticket
        // ==========================

        if (interaction.isChatInputCommand()) {

            if (interaction.commandName !== "setup-ticket") {
                return;
            }

            if (
                !interaction.member.permissions.has(
                    PermissionsBitField.Flags.Administrator
                )
            ) {

                await interaction.reply({
                    content: "❌ هذا الأمر للإدارة فقط.",
                    ephemeral: true
                });

                return;
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

            return;
        }

        // ==========================
        // اختيار نوع التكت
        // ==========================

        if (interaction.isStringSelectMenu()) {

            if (interaction.customId !== "rase_ticket_menu") {
                return;
            }

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

            const ticketName =
                ticketNames[interaction.values[0]] || "تكت";

            // ==========================
            // التأكد من عدم وجود تكت
            // ==========================

            const existingTicket =
                guild.channels.cache.find(function (channel) {

                    return (
                        channel.type === ChannelType.GuildText &&
                        channel.topic ===
                        "RaseTicket-" + member.id
                    );

                });

            if (existingTicket) {

                await interaction.editReply({
                    content:
                        "❌ عندك تكت مفتوح بالفعل: " +
                        existingTicket
                });

                return;
            }

            // ==========================
            // البحث عن الكاتيجوري
            // ==========================

            let category = null;

            if (TICKET_CATEGORY_ID) {

                category =
                    guild.channels.cache.get(
                        TICKET_CATEGORY_ID
                    ) || null;

            }

            if (!category) {

                category =
                    guild.channels.cache.find(
                        function (channel) {

                            return (
                                channel.type ===
                                ChannelType.GuildCategory &&
                                channel.name ===
                                "Rase Tickets"
                            );

                        }
                    ) || null;

            }

            // ==========================
            // إنشاء الكاتيجوري
            // ==========================

            if (!category) {

                category =
                    await guild.channels.create({

                        name: "Rase Tickets",

                        type:
                            ChannelType.GuildCategory

                    });

            }

            // ==========================
            // الصلاحيات
            // ==========================

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

            // ==========================
            // اسم التكت
            // ==========================

            const username =
                String(member.user.username)
                    .toLowerCase()
                    .replace(
                        /[^a-z0-9\u0600-\u06FF_-]/g,
                        "-"
                    )
                    .slice(0, 70) || "user";

            // ==========================
            // إنشاء التكت
            // ==========================

            const ticketChannel =
                await guild.channels.create({

                    name:
                        ticketName +
                        "-" +
                        username,

                    type:
                        ChannelType.GuildText,

                    parent:
                        category.id,

                    topic:
                        "RaseTicket-" +
                        member.id,

                    permissionOverwrites:
                        permissionOverwrites

                });

            // ==========================
            // رسالة التكت
            // ==========================

            const ticketEmbed =
                new EmbedBuilder()

                    .setColor("#4b0d1a")

                    .setTitle(
                        "🎫 " +
                        ticketName
                    )

                    .setDescription(

                        "أهلاً " +
                        member +
                        " 👋\n\n" +

                        "تم فتح تذكرتك بنجاح.\n" +

                        "يرجى كتابة طلبك بالتفصيل وانتظار رد الإدارة.\n\n" +

                        "**نوع التذكرة:** " +
                        ticketName +
                        "\n" +

                        "**صاحب التذكرة:** " +
                        member +
                        "\n\n" +

                        "🔒 عند الانتهاء اضغط على زر **إغلاق التكت**."

                    )

                    .setFooter({
                        text: "Rase Ticket System"
                    })

                    .setTimestamp();

            // ==========================
            // زر الإغلاق
            // ==========================

            const closeButton =
                new ButtonBuilder()

                    .setCustomId(
                        "rase_close_ticket"
                    )

                    .setLabel(
                        "إغلاق التكت"
                    )

                    .setEmoji("🔒")

                    .setStyle(
                        ButtonStyle.Danger
                    );

            const buttonRow =
                new ActionRowBuilder()
                    .addComponents(
                        closeButton
                    );

            const staffMention =
                STAFF_ROLE_ID
                    ? "<@&" +
                      STAFF_ROLE_ID +
                      ">"
                    : "";

            await ticketChannel.send({

                content:
                    member +
                    " " +
                    staffMention,

                embeds: [
                    ticketEmbed
                ],

                components: [
                    buttonRow
                ]

            });

            await interaction.editReply({

                content:
                    "✅ تم إنشاء تكتك: " +
                    ticketChannel

            });

            return;
        }

        // ==========================
        // زر إغلاق التكت
        // ==========================

        if (interaction.isButton()) {

            if (
                interaction.customId ===
                "rase_close_ticket"
            ) {

                const embed =
                    new EmbedBuilder()

                        .setColor("#8b0000")

                        .setTitle(
                            "🔒 إغلاق التكت"
                        )

                        .setDescription(
                            "هل أنت متأكد أنك تريد إغلاق هذه التذكرة؟"
                        );

                const confirmButton =
                    new ButtonBuilder()

                        .setCustomId(
                            "rase_confirm_close"
                        )

                        .setLabel(
                            "تأكيد الإغلاق"
                        )

                        .setEmoji("🔒")

                        .setStyle(
                            ButtonStyle.Danger
                        );

                const cancelButton =
                    new ButtonBuilder()

                        .setCustomId(
                            "rase_cancel_close"
                        )

                        .setLabel(
                            "إلغاء"
                        )

                        .setEmoji("❌")

                        .setStyle(
                            ButtonStyle.Secondary
                        );

                const row =
                    new ActionRowBuilder()
                        .addComponents(
                            confirmButton,
                            cancelButton
                        );

                await interaction.reply({

                    embeds: [
                        embed
                    ],

                    components: [
                        row
                    ]

                });

                return;
            }

            // ==========================
            // إلغاء الإغلاق
            // ==========================

            if (
                interaction.customId ===
                "rase_cancel_close"
            ) {

                await interaction.update({

                    content:
                        "✅ تم إلغاء إغلاق التكت.",

                    embeds: [],

                    components: []

                });

                return;
            }

            // ==========================
            // تأكيد الإغلاق
            // ==========================

            if (
                interaction.customId ===
                "rase_confirm_close"
            ) {

                await interaction.update({

                    content:
                        "🔒 سيتم إغلاق التكت خلال 3 ثواني...",

                    embeds: [],

                    components: []

                });

                setTimeout(
                    async function () {

                        try {

                            await interaction.channel.delete();

                        } catch (error) {

                            console.error(
                                "تعذر حذف التكت:",
                                error
                            );

                        }

                    },
                    3000
                );

            }

        }

    } catch (error) {

        console.error(
            "Interaction error:",
            error
        );

        try {

            if (
                interaction.deferred ||
                interaction.replied
            ) {

                await interaction.editReply({

                    content:
                        "❌ حدث خطأ أثناء تنفيذ الطلب."

                });

            } else {

                await interaction.reply({

                    content:
                        "❌ حدث خطأ أثناء تنفيذ الطلب.",

                    ephemeral: true

                });

            }

        } catch (replyError) {

            console.error(
                "Reply error:",
                replyError
            );

        }

    }

});

// ==============================
// أخطاء عامة
// ==============================

process.on(
    "unhandledRejection",
    function (error) {

        console.error(
            "Unhandled Rejection:",
            error
        );

    }
);

process.on(
    "uncaughtException",
    function (error) {

        console.error(
            "Uncaught Exception:",
            error
        );

    }
);

// ==============================
// فحص التوكن
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

// ==============================
// تسجيل دخول Discord
// ==============================

console.log(
    "Starting Discord login..."
);

console.log("Starting Discord login...");

client.on("error", function (error) {
    console.error("DISCORD CLIENT ERROR:");
    console.error(error);
});

client.on("debug", function (message) {
    console.log("DISCORD DEBUG: " + message);
});

client.login(TOKEN)
    .then(function () {
        console.log("LOGIN SUCCESS!");
    })
    .catch(function (error) {
        console.error("LOGIN FAILED!");
        console.error(error);
    });

setTimeout(function () {
    console.log("LOGIN TIMEOUT - Discord Gateway did not connect.");
}, 30000);

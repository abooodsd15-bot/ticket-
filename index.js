const {
    Client,
    GatewayIntentBits,
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
// الإعدادات
// ==============================

const TOKEN = process.env.TOKEN;
const GUILD_ID = "1518005370612617326";
const STAFF_ROLE_ID = "1518010146662518822";
const PORT = process.env.PORT || 10000;

// ==============================
// التأكد من التوكن
// ==============================

if (!TOKEN) {
    console.error("❌ TOKEN غير موجود في Environment Variables");
    process.exit(1);
}

// ==============================
// سيرفر Render
// ==============================

http.createServer((req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8"
    });

    res.end("Rase Ticket Bot is running!");
}).listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Web server running on port ${PORT}`);
});

// ==============================
// Discord Client
// ==============================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

// ==============================
// Slash Commands
// ==============================

const commands = [
    new SlashCommandBuilder()
        .setName("setup-ticket")
        .setDescription("إرسال لوحة التذاكر")
        .toJSON()
];

// ==============================
// Bot Ready
// ==============================

client.once("ready", async () => {

    console.log("================================");
    console.log("✅ Rase Ticket Bot ONLINE");
    console.log(`🤖 Bot: ${client.user.tag}`);
    console.log(`🏠 Servers: ${client.guilds.cache.size}`);
    console.log("================================");

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

        console.log("✅ تم تسجيل أمر /setup-ticket");

    } catch (error) {

        console.error("❌ خطأ في تسجيل الأمر:");
        console.error(error);

    }
});

// ==============================
// التفاعلات
// ==============================

client.on("interactionCreate", async (interaction) => {

    try {

        // ==========================
        // /setup-ticket
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

                return interaction.reply({
                    content: "❌ هذا الأمر للإدارة فقط.",
                    ephemeral: true
                });

            }

            const embed = new EmbedBuilder()
                .setColor("#8B0000")
                .setTitle("🎫 Rase Ticket")
                .setDescription(
                    "مرحباً بك في نظام التذاكر.\n\n" +
                    "اختر نوع التذكرة من القائمة بالأسفل.\n\n" +
                    "🎭 **طلب رول**\n" +
                    "لطلب رول من الإدارة.\n\n" +
                    "⚠️ **شكوى**\n" +
                    "لتقديم شكوى.\n\n" +
                    "👑 **طلب ادمن**\n" +
                    "لطلب مساعدة من الإدارة.\n\n" +
                    "❓ **استفسار**\n" +
                    "لأي استفسار أو مساعدة."
                )
                .setFooter({
                    text: "Rase Ticket System"
                });

            const menu = new StringSelectMenuBuilder()
                .setCustomId("rase_ticket_menu")
                .setPlaceholder("اختر نوع التذكرة")
                .addOptions([
                    {
                        label: "طلب رول",
                        description: "فتح تذكرة لطلب رول",
                        value: "role_request",
                        emoji: "🎭"
                    },
                    {
                        label: "شكوى",
                        description: "فتح تذكرة لتقديم شكوى",
                        value: "complaint",
                        emoji: "⚠️"
                    },
                    {
                        label: "طلب ادمن",
                        description: "فتح تذكرة لطلب إداري",
                        value: "admin_request",
                        emoji: "👑"
                    },
                    {
                        label: "استفسار",
                        description: "فتح تذكرة للاستفسار",
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

            return interaction.reply({
                content: "✅ تم إرسال لوحة التذاكر.",
                ephemeral: true
            });
        }

        // ==========================
        // اختيار نوع التذكرة
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

            const ticketTypes = {
                role_request: "طلب-رول",
                complaint: "شكوى",
                admin_request: "طلب-ادمن",
                inquiry: "استفسار"
            };

            const ticketName =
                ticketTypes[interaction.values[0]] || "تكت";

            // منع أكثر من تذكرة للشخص
            const existingTicket = guild.channels.cache.find(
                channel =>
                    channel.type === ChannelType.GuildText &&
                    channel.topic === `RaseTicket-${member.id}`
            );

            if (existingTicket) {

                return interaction.editReply({
                    content:
                        `❌ عندك تذكرة مفتوحة بالفعل: ${existingTicket}`
                });

            }

            // البحث عن الكاتيجوري
            let category = guild.channels.cache.find(
                channel =>
                    channel.type === ChannelType.GuildCategory &&
                    channel.name === "Rase Tickets"
            );

            // إنشاء الكاتيجوري إذا غير موجود
            if (!category) {

                category = await guild.channels.create({
                    name: "Rase Tickets",
                    type: ChannelType.GuildCategory
                });

            }

            // الصلاحيات
            const permissions = [
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

            // صلاحيات الإدارة
            if (
                STAFF_ROLE_ID &&
                guild.roles.cache.has(STAFF_ROLE_ID)
            ) {

                permissions.push({
                    id: STAFF_ROLE_ID,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.ManageChannels
                    ]
                });

            }

            const username = member.user.username
                .toLowerCase()
                .replace(/[^a-z0-9\u0600-\u06FF_-]/g, "-")
                .slice(0, 60);

            // إنشاء التذكرة
            const ticketChannel = await guild.channels.create({
                name: `${ticketName}-${username || "user"}`,
                type: ChannelType.GuildText,
                parent: category.id,
                topic: `RaseTicket-${member.id}`,
                permissionOverwrites: permissions
            });

            const ticketEmbed = new EmbedBuilder()
                .setColor("#8B0000")
                .setTitle(`🎫 ${ticketName}`)
                .setDescription(
                    `أهلاً ${member} 👋\n\n` +
                    "تم فتح تذكرتك بنجاح.\n" +
                    "اكتب طلبك بالتفصيل وانتظر رد الإدارة.\n\n" +
                    `**نوع التذكرة:** ${ticketName}\n\n` +
                    "🔒 عند الانتهاء اضغط على زر إغلاق التكت."
                )
                .setFooter({
                    text: "Rase Ticket System"
                });

            const closeButton = new ButtonBuilder()
                .setCustomId("rase_close_ticket")
                .setLabel("إغلاق التكت")
                .setEmoji("🔒")
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder()
                .addComponents(closeButton);

            const staffMention =
                STAFF_ROLE_ID
                    ? `<@&${STAFF_ROLE_ID}>`
                    : "";

            await ticketChannel.send({
                content: `${member} ${staffMention}`,
                embeds: [ticketEmbed],
                components: [row]
            });

            return interaction.editReply({
                content: `✅ تم إنشاء تذكرتك: ${ticketChannel}`
            });
        }

        // ==========================
        // زر إغلاق التكت
        // ==========================

        if (interaction.isButton()) {

            if (interaction.customId === "rase_close_ticket") {

                const embed = new EmbedBuilder()
                    .setColor("#8B0000")
                    .setTitle("🔒 إغلاق التكت")
                    .setDescription(
                        "هل أنت متأكد أنك تريد إغلاق هذه التذكرة؟"
                    );

                const confirm = new ButtonBuilder()
                    .setCustomId("rase_confirm_close")
                    .setLabel("تأكيد الإغلاق")
                    .setEmoji("🔒")
                    .setStyle(ButtonStyle.Danger);

                const cancel = new ButtonBuilder()
                    .setCustomId("rase_cancel_close")
                    .setLabel("إلغاء")
                    .setEmoji("❌")
                    .setStyle(ButtonStyle.Secondary);

                const row = new ActionRowBuilder()
                    .addComponents(confirm, cancel);

                return interaction.reply({
                    embeds: [embed],
                    components: [row]
                });
            }

            if (interaction.customId === "rase_cancel_close") {

                return interaction.update({
                    content: "✅ تم إلغاء إغلاق التكت.",
                    embeds: [],
                    components: []
                });
            }

            if (interaction.customId === "rase_confirm_close") {

                await interaction.update({
                    content: "🔒 سيتم إغلاق التكت خلال 3 ثواني...",
                    embeds: [],
                    components: []
                });

                setTimeout(async () => {

                    try {
                        await interaction.channel.delete();
                    } catch (error) {
                        console.error(
                            "❌ فشل حذف التكت:",
                            error
                        );
                    }

                }, 3000);
            }
        }

    } catch (error) {

        console.error("❌ Interaction Error:");
        console.error(error);

        try {

            if (interaction.deferred || interaction.replied) {

                await interaction.editReply({
                    content: "❌ حدث خطأ أثناء تنفيذ الطلب."
                });

            } else {

                await interaction.reply({
                    content: "❌ حدث خطأ أثناء تنفيذ الطلب.",
                    ephemeral: true
                });

            }

        } catch {}
    }
});

// ==============================
// أخطاء Discord
// ==============================

client.on("error", error => {
    console.error("❌ Discord Client Error:");
    console.error(error);
});

client.on("shardError", error => {
    console.error("❌ Discord Gateway Error:");
    console.error(error);
});

// ==============================
// تسجيل الدخول
// ==============================

console.log("🔄 Connecting to Discord...");

client.login(TOKEN)
    .then(() => {
        console.log("✅ Discord login successful!");
    })
    .catch(error => {
        console.error("❌ Discord login failed!");
        console.error(error);
    });

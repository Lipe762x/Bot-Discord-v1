let hastebin = require('hastebin');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isButton()) return;
    if (interaction.customId == "open-ticket") {
      if (client.guilds.cache.get(interaction.guildId).channels.cache.find(c => c.topic == interaction.user.id)) {
        return interaction.reply({
          content: 'Você já criou um ticket !',
          ephemeral: true
        });
      };

      interaction.guild.channels.create(`ticket-${interaction.user.username}`, {
        parent: client.config.categoria,
        topic: interaction.user.id,
        permissionOverwrites: [{
            id: interaction.user.id,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: client.config.cargo,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: interaction.guild.roles.everyone,
            deny: ['VIEW_CHANNEL'],
          },
        ],
        type: 'text',
      }).then(async c => {
        interaction.reply({
          content: `Ticket criado! <#${c.id}>`,
          ephemeral: true
        });

        //const embed = new client.discord.MessageEmbed()
          //.setColor('fc4100')
          //.setAuthor('Ticket', 'https://i.imgur.com/oO5ZSRK.png')
        //  .setDescription('Selecione a categoria do ticket')
          //.setFooter('test.lipe', 'https://i.imgur.com/oO5ZSRK.png')
         // .setTimestamp();

        const row = new client.discord.MessageActionRow()
          .addComponents(
            new client.discord.MessageSelectMenu()
            .setCustomId('category')
            .setPlaceholder('Selecione a categoria do ticket')
            .addOptions([{
                label: 'Suporte',
                value: 'Suporte',
                emoji: '💬',
              },
              {
                label: 'Denúncia',
                value: 'Denúncia',
                emoji: '⛔',
              },
              {
                label: 'Devolução',
                value: 'Devolução',
                emoji: '♻',
              },
            ]),
          );

        msg = await c.send({
          content: `<@!${interaction.user.id}>`,
          // embeds: [embed],
          components: [row]
        });

        const collector = msg.createMessageComponentCollector({
          componentType: 'SELECT_MENU',
          time: 20000
        });

        collector.on('collect', i => {
          if (i.user.id === interaction.user.id) {
            if (msg.deletable) {
              msg.delete().then(async () => {
                const embed = new client.discord.MessageEmbed()
                  .setColor('fc4100')
                  .setAuthor('Ticket Criado com Sucesso!', 'https://cdn.discordapp.com/attachments/906714610571304980/962027301946658886/unknown.png')
                  .setDescription(`Olá <@!${interaction.user.id}> Todos os responsáveis pelo ticket já estão cientes da abertura do mesmo, peço que aguarde e evite chamar-nos via DM!`)
                  .setFooter('Havana Roleplay', client.user.avatarURL())
                  .setTimestamp();

                const row = new client.discord.MessageActionRow()
                  .addComponents(
                    new client.discord.MessageButton()
                    .setCustomId('close-ticket')
                    .setLabel('Fechar ticket')
                    .setEmoji('❌')
                    .setStyle('DANGER'),
                  );

                const opened = await c.send({
                  content: `<@&${client.config.cargo}>`,
                  embeds: [embed],
                  components: [row]
                });

                opened.pin().then(() => {
                  opened.channel.bulkDelete(1);
                });
              });
            };
            if (i.values[0] == 'Suporte') {
              c.edit({
                parent: client.config.suporte
              });
            };
            if (i.values[0] == 'Denúncia') {
              c.edit({
                parent: client.config.denuncia
              });
            };
            if (i.values[0] == 'Devolução') {
              c.edit({
                parent: client.config.devolucao
              });
            };
          };
        });

        collector.on('end', collected => {
          if (collected.size < 1) {
            c.send(`Oops! Você não escolheu nenhuma categoria, fechando o ticket!`).then(() => {
              setTimeout(() => {
                if (c.deletable) {
                  c.delete();
                };
              }, 5000);
            });
          };
        });
      });
    };

    if (interaction.customId == "close-ticket") {
      const guild = client.guilds.cache.get(interaction.guildId);
      const chan = guild.channels.cache.get(interaction.channelId);

      const row = new client.discord.MessageActionRow()
        .addComponents(
          new client.discord.MessageButton()
          .setCustomId('confirm-close')
          .setLabel('Fechar o ticket')
          .setStyle('DANGER'),
          new client.discord.MessageButton()
          .setCustomId('no')
          .setLabel('Deseja cancelar?')
          .setStyle('SECONDARY'),
        );

      const verif = await interaction.reply({
        content: 'Tem certeza de que deseja fechar o ticket?',
        components: [row]
      });

      const collector = interaction.channel.createMessageComponentCollector({
        componentType: 'BUTTON',
        time: 10000
      });

      collector.on('collect', i => {
        if (i.customId == 'confirm-close') {
          interaction.editReply({
            content: `Ticket fechado por <@!${interaction.user.id}>`,
            components: []
          });

          chan.edit({
              name: `fechado-${chan.name}`,
              permissionOverwrites: [
                {
                  id: client.users.cache.get(chan.topic),
                  deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                },
                {
                  id: client.config.cargo,
                  allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                },
                {
                  id: interaction.guild.roles.everyone,
                  deny: ['VIEW_CHANNEL'],
                },
              ],
            })
          //   .then(async () => {
           //    const embed = new client.discord.MessageEmbed()
           //     .setColor('6d6ee8')
           //    .setAuthor('', 'https://i.imgur.com/oO5ZSRK.png')
               //.setDescription('```Controle de tickets```')
               // .setFooter('lipe.test', 'https://i.imgur.com/oO5ZSRK.png')
              //  .setTimestamp();

              const row = new client.discord.MessageActionRow()
                .addComponents(
                  new client.discord.MessageButton()
                  .setCustomId('delete-ticket')
                  .setLabel('Excluir?')
                  .setEmoji('<:thonkeyes:873329169029820447>')
                  .setStyle('DANGER'),
                );

              chan.send({
               //  embeds: [embed],
                components: [row]
              });
         //   });

          collector.stop();
        };
        if (i.customId == 'no') {
          interaction.editReply({
            content: 'Cancelado com sucesso! o ticket não será fechado...',
            components: []
          });
          collector.stop();
        };
      });

      collector.on('end', (i) => {
        if (i.size < 1) {
          interaction.editReply({
            content: 'Fechando o ticket!',
            components: []
          });
        };
      });
    };

    if (interaction.customId == "delete-ticket") {
      const guild = client.guilds.cache.get(interaction.guildId);
      const chan = guild.channels.cache.get(interaction.channelId);

      interaction.reply({
        content: 'ERROR 404. Contate-me urgente! <@359498243463184385>'
      });

      chan.messages.fetch().then(async (messages) => {
        let a = messages.filter(m => m.author.bot !== true).map(m =>
          `${new Date(m.createdTimestamp).toLocaleString('fr-FR')} - ${m.author.username}#${m.author.discriminator}: ${m.attachments.size > 0 ? m.attachments.first().proxyURL : m.content}`
        ).reverse().join('\n');
        if (a.length < 1) a = "Nothing"
        hastebin.createPaste(a, {
            contentType: 'text/plain',
            server: 'https://hastebin.com/'
          }, {})
          .then(function (urlToPaste) {
            const embed = new client.discord.MessageEmbed()
              //.setAuthor('Logs Ticket', 'https://i.imgur.com/oO5ZSRK.png')
             // .setDescription(`📰 Logs du ticket \`${chan.id}\` créé par <@!${chan.topic}> et supprimé par <@!${interaction.user.id}>\n\nLogs: [**Cliquez ici pour voir les logs**](${urlToPaste})`)
              //.setColor('2f3136')
              //.setTimestamp();

            const embed2 = new client.discord.MessageEmbed()
              //.setAuthor('Logs Ticket', 'https://i.imgur.com/oO5ZSRK.png')
              //.setDescription(`https://tenor.com/view/dance-kid-club-gif-9152583`)
              //.setColor('2f3136')
              //.setTimestamp();

            //client.channels.cache.get(client.config.logsTicket).send({
              //embeds: [embed]
            //});
            client.users.cache.get(chan.topic).send({
              embeds: [embed2]
            }).catch(() => {console.log('Ticket Fechado!')});
            chan.send('Excluindo o canal...');

            setTimeout(() => {
              chan.delete();
            }, 5000);
          });
      });
    };
  },
};

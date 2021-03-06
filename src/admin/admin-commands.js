const common = require("../general/common");
const config = require("../config");

async function hasPermission(message, id) {
  const isAdmin = await common
    .sql(`SELECT * FROM admins WHERE UID = "${id}"`)
    .catch(err => {
      console.log(err);
    });
  if (message.member.hasPermission("ADMINISTRATOR")) {
    return true;
  }

  if (isAdmin.id.length >= 1) {
    return true;
  }
  return false;
}

module.exports.addAdmin = async message => {
  const hasPerm = await hasPermission(message, message.author.id);
  if (!hasPerm) {
    common.reply(
      message,
      "Error. You have invalid permissions for this command."
    );
    return;
  }

  if (message.mentions.users.size === 0) {
    common.reply(message, "Error. Please @ a user to be added as admin.");
    return;
  }

  const id = message.mentions.users.array()[0].id;
  const username = message.mentions.users.array()[0].username;
  const answer = await common
    .sql("INSERT INTO admins VALUES(?,?)", [id, username])
    .catch(msg => {
      console.log(msg.err.toString());
    });
  if (answer !== undefined) {
    common.say(message, `<@${id}> added as an admin.`);
  }
};

//TODO - Return error if user isn't in the table
module.exports.removeAdmin = async message => {
  const hasPerm = await hasPermission(message, message.author.id);
  if (!hasPerm) {
    common.reply(
      message,
      "Error. You have invalid permissions for this command."
    );
    return;
  }

  if (message.mentions.users.size === 0) {
    common.reply(message, "Error. Please @ a user to be removed as admin.");
    return;
  }
  const id = message.mentions.users.array()[0].id;
  await common.sql("DELETE FROM admins WHERE uid = ?", [id]).catch(msg => {
    console.log(msg.err.toString());
  });
  common.say(message, `<@${id}> removed as an admin.`);
};

module.exports.listAdmins = async message => {
  const answer = await common.sql("SELECT * FROM admins", []).catch(msg => {
    console.log(msg.err.toString());
  });
  const allAdmins = Object.values(answer.id)
    .map(i => {
      return Object.values(i)[1];
    })
    .join("\n");

  if (allAdmins.length === 0) {
    console.log(
      "No users are listed as admins.\nHowever any users with the administrator permission are also considered admins by the bot."
    );
  } else {
    console.log(
      `List of all current Admins:\n--------\n${allAdmins}\n--------\n\nAny users with the administrator permission are also considered admins by the bot and may not be present in this list.`
    );
  }
};

module.exports.blackList = async message => {
  const hasPerm = await hasPermission(message, message.author.id);
  if (!hasPerm) {
    common.reply(
      message,
      "Error. You have invalid permissions for this command."
    );
    return;
  }

  if (message.mentions.users.size === 0) {
    common.reply(message, "Error. Please @ a user to be blacklisted.");
    return;
  }

  const id = message.mentions.users.array()[0].id;
  const username = message.mentions.users.array()[0].username;
  const answer = await common
    .sql("INSERT INTO blacklist VALUES(?,?,?)", [
      id,
      username,
      new Date().getTime()
    ])
    .catch(msg => {
      console.log(msg.err.toString());
    });
  if (answer !== undefined) {
    common.say(message, `<@${id}> blacklisted.`);
  }
};

module.exports.unBlackList = async message => {
  const hasPerm = await hasPermission(message, message.author.id);
  if (!hasPerm) {
    common.reply(
      message,
      "Error. You have invalid permissions for this command."
    );
    return;
  }

  if (message.mentions.users.size === 0) {
    common.reply(message, "Error. Please @ a user to be unblacklisted.");
    return;
  }
  const id = message.mentions.users.array()[0].id;
  await common
    .sql("DELETE FROM blacklist WHERE blockedUID = ?", [id])
    .catch(msg => {
      console.log(msg.err.toString());
    });
  common.say(message, `<@${id}> unblacklisted.`);
};

//TODO add error if bot doesn't have permissions
module.exports.purge = async (message, num) => {
  const hasPerm = await hasPermission(message, message.author.id);
  if (!hasPerm) {
    common.reply(
      message,
      "Error. You have invalid permissions for this command."
    );
    return;
  }

  if (isNaN(num)) {
    common.reply(message, `Error. ${num} is not a valid input.`);
    return;
  }

  if (num > config.max_purge_num || num <= 0) {
    common.reply(
      message,
      `Error. ${num} is invalid. Please choose a number less than ${config.max_purge_num} and greater than 0.`
    );
    return;
  }
  const number = parseInt(num);

  message.channel
    .bulkDelete(number + 1)
    .then(messages =>
      console.log(
        `Bulk deleted ${messages.size} messages. Invoked by ` +
          message.author.username
      )
    )
    .catch(console.error);

  console.log(":no_entry_sign:**PURGING COMPLETE**:no_entry_sign:");
  message.channel.bulkDelete(1);
};

module.exports.isBlackListed = isBlackListed = async id => {
  const isBlackListed = await common
    .sql(`SELECT * FROM blacklist WHERE blockedUID = "${id}"`)
    .catch(() => {});
  if (isBlackListed) {
    return false;
  }
  return true;
};

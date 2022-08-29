import express from "express";
import TelegramBot from "node-telegram-bot-api";

const app = express();
const port = 3000;

var gameStarted = false;
var audio = "sounds/frogs atmosphere.mp3";
var fruitNumber = 0;
const players = { FROG: "frog", ME: "me" };
// кто ходит следующим: 0 - жаба, 1 - я
var nextPlayer = players.FROG;

const emoji = {
  RUSSIAN_FLAG: "\u{1F1F7}\u{1F1FA}",
  TOMATO: "\u{1F345}",
  AMANITA: "\u{1F344}",
  FROG: "\u{1F438}",
  WINNER: "\u{1F973}",
  LOOSER: "\u{1F61D}",
  VOMTING: "\u{1F92E}",
};

const fruts = {
  RED_APPLE: "\u{1F34E}",
  GREEN_APPLE: "\u{1F34F}",
  BANANA: "\u{1F34C}",
  PINEAPPLE: "\u{1F34D}",
};

var currentFruit = fruts.GREEN_APPLE;
var fruit1 = new RegExp(currentFruit, "g");

const botMessages = {
  START: `${fruts.BANANA} Напиши количество фруктов, с которыми будем играть!\n\n${fruts.BANANA} Количество от 20 до 100`,
  YOU_LOOSE: `Ты проиграл!`,
  YOU_WIN: `Ты выиграл!`,
};

const token = "5542129900:AAEVowasieqrKkCSiqqbHBfaTUMtGVfAztM";
const bot = new TelegramBot(token, {
  polling: true,
});

function changeNextPlayer() {
  if (nextPlayer === players.FROG) {
    nextPlayer = players.ME;
  } else {
    nextPlayer = players.FROG;
  }
}

// создаем строку из фруктов и Жабы
function generateFruitString(number) {
  return currentFruit.repeat(number).concat(emoji.FROG);
}

function restart() {
  gameStarted = false;
  fruitNumber = 0;
  nextPlayer = players.FROG;
}

function start(chatId) {
  bot.sendAudio(chatId, audio, { caption: botMessages.START });
}

function showRules(chatId) {
  bot.sendMessage(chatId, `Правила игры: ...`);
}

function createMenuKeyboardLayout(chatId) {
  bot.sendMessage(chatId, `Сыграем ещё раз?`, {
    reply_markup: {
      keyboard: [["Играть"], ["Правила"]],
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  });
}

// расчитываем количество кнопок с фруктами, которые возможно съесть
function createFruitKeyboardLayout(number) {
  console.log(`keyboard -> ${number}`);
  var fruitButtonCount = 3;
  var buttons = [];
  if (number == 2) {
    fruitButtonCount = 2;
  } else if (number == 1) {
    fruitButtonCount = 1;
  }

  for (var i = 0; i < fruitButtonCount; i++) {
    buttons[i] = [currentFruit.repeat(i + 1)];
  }

  return buttons;
}

function sendYouLooseMessage(chatId) {
  bot.sendMessage(chatId, botMessages.YOU_LOOSE).then(() => {
    bot.sendMessage(chatId, emoji.LOOSER);
  });
}

function sendYouWinMessage(chatId) {
  bot.sendMessage(chatId, botMessages.YOU_WIN).then(() => {
    bot.sendMessage(chatId, emoji.WINNER);
  });
}

async function frogEatFruit(chatId) {
  var maxNumber = 3;
  var randomNum = 0;
  if (fruitNumber === 1) {
    maxNumber = 1;
  } else if (randomNum === 2) {
    maxNumber = 2;
  }
  randomNum = Math.floor(Math.random() * maxNumber) + 1;
  bot
    .sendMessage(
      chatId,
      `Я съем ${randomNum}: ${currentFruit.repeat(randomNum)}`
    )
    .then(() => {
      somebodyEatFruit(chatId, randomNum);
    });
}

function somebodyEatFruit(chatId, count) {
  fruitNumber -= count;
  console.log(`${nextPlayer} поел ${count} фруктов`);
  changeNextPlayer();
  console.log(`следующий ${nextPlayer}\nОсталось ${fruitNumber}\n`);
  var fruitString = generateFruitString(fruitNumber);
  bot.sendMessage(chatId, fruitString).then(() => {
    if (fruitNumber == 1) {
      // последний фрукт достался боту
      if (nextPlayer === players.FROG) {
        frogEatFruit(chatId);
      }
    } else if (fruitNumber === 0) {
      if (nextPlayer === players.FROG) {
        sendYouWinMessage(chatId);

        restart();
        createMenuKeyboardLayout(chatId);
      } else {
        sendYouLooseMessage(chatId).then(() => {
          restart();
          createMenuKeyboardLayout(chatId);
        });
      }
    } else {
      if (nextPlayer === players.FROG) {
        frogEatFruit(chatId)
        // .then(()=>{
        //   bot.sendMessage(chatId, `Твой ход`, {
        //     reply_markup: {
        //       keyboard: createFruitKeyboardLayout(fruitNumber),
        //       one_time_keyboard: true,
        //       resize_keyboard: true,
        //     },
        //   });
        // });

        
      }
    }
  });
}

// начало игры
bot.onText(/\/start/, (msg) => {
  if (!gameStarted) {
    const chatId = msg.chat.id;
    console.log(chatId)
    start(chatId);
  }
});

// прислали число фруктов
bot.onText(/^\d+$/, (msg, text) => {
  const number = text[0];
  if (!gameStarted && number <= 100 && number >= 20) {
    const chatId = msg.chat.id;
    gameStarted = true;
    fruitNumber = number;
    var fruitWord = "фруктов";
    var lastNumber = number.toString()[1];
    var fruitString = generateFruitString(fruitNumber);
    switch (lastNumber) {
      case "1":
        fruitWord = "фрукт";
        break;
      case "2":
      case "3":
      case "4":
        fruitWord = "фрукта";
        break;
    }
    bot
      .sendMessage(
        chatId,
        `Принято! Несу ${number} ${fruitWord} и Жабу! ${emoji.FROG}`
      )
      .then(() => {
        bot.sendMessage(chatId, fruitString).then(() => {
          bot.sendMessage(chatId, "Кто начнёт?", {
            reply_markup: {
              keyboard: [["Я"], ["Жаба-Бот"]],
              one_time_keyboard: true,
              resize_keyboard: true,
            },
          });
        });
      });
  }
});

bot.onText(/\Жаба-Бот/, (msg) => {
  if (gameStarted) {
    const chatId = msg.chat.id;
    frogEatFruit(chatId);
    bot.sendMessage(chatId, "Твой ход!", {
      reply_markup: {
        keyboard: createFruitKeyboardLayout(fruitNumber),
      },
    });
  }
});

bot.onText(/\Я/, (msg) => {
  if (gameStarted) {
    const chatId = msg.chat.id;
    changeNextPlayer();
    bot.sendMessage(chatId, "Сколько фруктов съешь?", {
      reply_markup: {
        keyboard: createFruitKeyboardLayout(fruitNumber),
      },
    });
  }
});

// прислали количество съеденных фруктов
bot.onText(fruit1, (msg, match) => {
  const chatId = msg.chat.id;
  var count = match.input.match(fruit1).length;
  somebodyEatFruit(chatId, count);
});

bot.onText(/\Правила/, (msg) => {
  showRules(msg.chat.id);
});

bot.onText(/\Играть/, (msg) => {
  start(msg.chat.id);
});

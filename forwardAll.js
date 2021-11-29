const TeleBot = require('telebot')
const { getAllUsers } = require('./database')
require('dotenv').config()

const token = process.env.API_KEY
const bot = new TeleBot(token)

getAllUsers()
    .then(users => {
        users.forEach(user => {
            bot.forwardMessage(user.chat_id, -1001404127129, 16)
            .then(() => console.log(`Sending to ${user.firstname} `+"\033[32m"+"Success"+"\033[0m"))
            .catch(e => console.log(`Sending to ${user.firstname} `+"\033[31m"+"Failed"+"\033[0m"))
        })
    })
    .catch(err => console.error(err))
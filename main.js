const TeleBot = require('telebot')
const searchYT = require('yt-search')
const { getStatus } = require('./database')
const { send_log, query, count } = require('./query.js')
require('dotenv').config()

const token = process.env.API_KEY
const bot = new TeleBot(token)

bot.on(['/start', '/hello'], (msg) => msg.reply.text('[🍑] > به سریع ترین بات موزیک تلگرام خوش اومدی😉✅ \n اسم موزیک یا لینک یوتوبشو برام بفرست و خودت نتیجه رو ببین‼️🔞 \n اگه حال کردی مارو به دوستات معرفی کن♥️ \n\n [🍑] > Hi There, Welcome to the fastest telegram music bot ever! Wanna liten to a music? Send me the name or its Youtube URL 😉'))

bot.on('/donate', (msg) => msg.reply.text(' [>] https://www.paypal.me/znightfuryz \n [IRAN]> https://idpay.ir/nelody'))

bot.on('/joom', msg => {
    if (msg.from.id === 111733645 || msg.from.id === 214619416)
        getStatus()
            .then(res => msg.reply.text(`Users: ${res.users}\n\nMemory: All ${count.all} | Success ${count.success}\n\nDatabase: All ${res.all} | Success ${res.success}`))
            .catch((e) => send_log(bot, `User: ${msg.from.id}\nQuery: ${msg.query}\nError: ${e.description}`))
})

bot.on('text', async (msg) => {
    if (['/joom', '/donate', '/start', '/hello'].includes(msg.text)) return
    if (msg.chat.id === -1001749065212 || msg.chat.id === -1001765223291) return

    query(bot, msg)
})

bot.start()

// Interval Test Log
setInterval(() => {
    const msg = {
        text: "Tataloo Amanat",
        chat: {
            id: -1001749065212
        },
        message_id: 1,
        from: {
            id: 1,
            username: "mmd",
            first_name: "gholi"
        }
    }
    query(bot, msg, true)
}, 30 * 60 * 1000)
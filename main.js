const TeleBot = require('telebot')
const searchYT = require('yt-search')
const admin = require('./admin')
const { getStatus } = require('./database')
const { send_log, query, count } = require('./query.js')
require('dotenv').config()

const token = process.env.API_KEY
const bot = new TeleBot(token)
const admins = process.env.ADMINS.split(",").map(Number)

bot.on(['/start', '/hello'], (msg) => msg.reply.text('[🍑] > به سریع ترین بات موزیک تلگرام خوش اومدی😉✅ \n اسم موزیک یا لینک یوتوبشو برام بفرست و خودت نتیجه رو ببین‼️🔞 \n اگه حال کردی مارو به دوستات معرفی کن♥️ \n\n [🍑] > Hi There, Welcome to the fastest telegram music bot ever! Wanna liten to a music? Send me the name or its Youtube URL 😉'))

bot.on('/donate', (msg) => msg.reply.text('[IRAN]> https://idpay.ir/nelody\n\n[PAYPAL]> https://www.paypal.me/znightfuryz'))

bot.on('/joom', msg => {
    const is_admin = (admins.indexOf(msg.from.id) >= 0)
    if (is_admin)
        getStatus()
            .then(res => msg.reply.text(`Users: ${res.users}\n\nMemory: All ${count.all} | Success ${count.success}\n\nDatabase: All ${res.all} | Success ${res.success}`))
            .catch((e) => send_log(bot, `User: ${msg.from.id}\nQuery: ${msg.query}\nError: ${JSON.stringify(e)}`))
})

bot.on('/send', msg => {
    const is_admin = (admins.indexOf(msg.form.id) >= 0)
    try {
        if (is_admin) {
            const query = msg.text.split('\n')
            const user_id = query[0].split(' ')[1]
        
            query.shift()
            admin.sendToUser(bot, msg, user_id, query.join('\n'))
        }
    }
    catch (e) {
        send_log(bot, `User: ${msg.from.id}\nQuery: ${msg.query}\nError: ${JSON.stringify(e)}`)
    }
})

bot.on('/user', msg => {
    const is_admin = (admins.indexOf(msg.form.id) >= 0)
    if (is_admin) {
        admin.searchUser(msg)
    }
})

bot.on('/search', msg => bot.forwardMessage(msg.chat.id, -1001404127129, 16))

bot.on('text', async (msg) => {
    const log_channel_id = Number(process.env.LOG_CHANNEL_ID) ? Number(process.env.LOG_CHANNEL_ID) : null
    const bannedCmds = ['/joom', '/donate', '/start', '/hello', '/user', '/send', '/search']
    if (bannedCmds.some((cmd => msg.text.startsWith(cmd)))) return
    if (msg.chat.id === -1001749065212 || msg.chat.id === log_channel_id) return

    query(bot, msg)
})

bot.on('inlineQuery', async msg => {
    if (!msg.query) return

    const answers = bot.answerList(msg.id, { cacheTime: 0 })
    const result = await searchYT(`${msg.query} audio`)
    
    if (result.videos.length > 1) {
        result.videos.forEach(async (v, i) => {
            v.seconds < 2400 &&
                await answers.addArticle({
                    id: i,
                    title: v.title,
                    description: v.description,
                    thumb_url: v.thumbnail,
                    message_text: v.url
                })
            
            if (result.videos.length-1 == i) 
                bot.answerQuery(answers, { cacheTime: 0 })
                    .catch((e) => send_log(bot, `User: ${msg.from.id}\nQuery: ${msg.query}\nError: ${e.description}`))
        })
    }
    else {
        await answers.addArticle({
            id: 1,
            title: "Error 404",
            description: "Your requested music does not found",
            message_text: "-"
        })
            
        bot.answerQuery(answers, { cacheTime: 0 })
            .catch((e) => send_log(bot, `User: ${msg.from.id}\nQuery: ${msg.query}\nError: ${e.description}`))
    }
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
}, 60 * 60 * 1000)

const ytdl = require('ytdl-core')
const searchYT = require('yt-search')
const { exec } = require('child_process')
const database = require('./database')
const captions = require('./captions.json')

const status = []
const count = { all: 0, success: 0 }
const url_expression = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi
const url_regex = new RegExp(url_expression)

function getYoutubeUrlId(url) {
    const urlObject = new URL(url)
    let urlOrigin = urlObject.origin
    let urlPath = urlObject.pathname
    
    if (urlOrigin.search('youtu.be') > -1) {
        return urlPath.substr(1)
    }

    if (urlPath.search('embed') > -1) {
        return urlPath.substr(7)
    }

    return urlObject.searchParams.get('v')
}

function cleanTitle(title) {
    title = title.replace(/`/g, " ")
    title = title.replace(/'/g, " ")
    title = title.replace(/"/g, " ")
    title = title.replace(/\//g, " ")
    title = title.replace(/\\/g, " ")
    return title
}

function send_log(bot, msg) {
    bot.sendMessage(-1001765223291, msg).catch(console.log)
}

async function findVideo(query) {
    const result = await searchYT(`${query} audio`)
    return (result.videos.length > 1) ? result.videos[0] : null
}

function cleanUp(chatID) {
    exec(`rm storage/${chatID}*`, () => {
        status[chatID] = false
    })
}

async function query(bot, msg, test=false) {
    count.all++

    // < --- User Details --- >
    const chatID = msg.chat.id
    const userID = msg.from.id
    const username = msg.from.username
    const firstname = msg.from.first_name
    // < --- End --- >

    database.addUser(username, firstname, userID, chatID)
        .then(() => {
            database.updateAll(userID)
        })
        .catch((e) => send_log(bot, `UserID: ${userID}\nQuery: ${msg.text}\n${e}`))

    const isUrl = msg.text.match(url_regex)
    if (isUrl) {
        msg.text = getYoutubeUrlId(msg.text)
        if (!msg.text) {
            bot.sendMessage(chatID, '[❗] Invalid URL')
            return
        }
    }

    if (status[chatID]) {
        bot.sendMessage(chatID, `[❗] Please wait until your last query is completed.`)
        return
    }

    status[chatID] = true
    try {
        if (isUrl) {
            var video = await ytdl.getInfo(msg.text)
            video.title = video.videoDetails.title
            video.url = video.videoDetails.video_url
            video.seconds = video.videoDetails.lengthSeconds
        }
        else {
            var video = await findVideo(msg.text)
            video.seconds = video.duration.seconds
        }
    }
    catch(e) {
        if (!video) {
            cleanUp(chatID)
            bot.sendMessage(chatID, `[❗] Your requested music is not available.`)
            return
        }
    }

    const vlen = video.seconds 

    if (vlen < 2400) {
        bot.sendMessage(chatID, `[🍑] Downloading ${video.title}...`) 
        .then(async _ => {
            const dl_timeout = setTimeout(() => {
                yt_process.kill('SIGKILL')
                cleanUp(chatID)
                bot.sendMessage(chatID, `[❗] Download took more than 20 seconds, Please try again...`)
            }, 20000)
            
            const path = `storage/${chatID}-${msg.message_id}.mp3`
            const caption = captions[Math.floor(Math.random() * captions.length)]
            const yt_process = exec(`python3 downloader.py "${video.url}" "${chatID}" "${msg.message_id}"`, (err, stdout, stderr) => {
                clearTimeout(dl_timeout)
                bot.sendAudio(chatID, path, { fileName: test ? new Date().toUTCString() : `${cleanTitle(video.title)}.mp3`, caption: caption, serverDownload: true, title: `${cleanTitle(video.title)}`, performer: `Nelody`})
                    .then(_ => {
                        count.success++
                        cleanUp(chatID)
                        database.updateSuccess(userID)
                    })
                    .catch(err => {
                        cleanUp(chatID)
                        bot.sendMessage(chatID, `[❗] Something went wrong, Please try again...`)
                        send_log(bot, `UserID: ${userID}\nQuery: ${msg.text}\n${err}`)
                    })
            })
        })
    } 
    else {
        cleanUp(chatID)
        bot.sendMessage(chatID, `[❗] Your music is more than 40 Minutes.`)
    }
}

module.exports = {
    send_log: send_log,
    query: query,
    count: count
}
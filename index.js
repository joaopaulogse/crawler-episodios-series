const cheerio = require("cheerio")
const request = require("request")
const fs = require("fs")
const URL_BASE = 'http://www.seriesintorrent.com/'
const proxy = process.env.HTTP_PROXY || ''//http://<user>:<password>@<host>:<port>/'

const getBody = (url) => {
    return new Promise((resolve, reject) => {
        request(url, { proxy }, (err, response, body) => {
            if (err) {
                reject(err)
            } else {
                resolve({ response, body })
            }
        })
    })
}

const $ = (body, select) => {
    const _$ = cheerio.load(body)
    return _$(select)
}


fs.exists(__dirname + '/ep', (exists) => {
    if (!exists) {
        fs.mkdir(__dirname + '/ep')
    }
})

const downloadFiles = async (url, path, nameFile) => {
    return request(url, { proxy })
                .on('error', (error) => console.error(error))
                .pipe(await fs.createWriteStream(`${path}/${nameFile}.rar`))
}

const crawler = async url => {
    try {

        const { body } = await getBody(url)
        $(body, 'li a').map(function (i, element) {
            element.children.map(async name => {
                if (name.data.toLowerCase().includes("the flash")) {
                    const { href } = element.attribs
                    const { body } = await getBody(href)
                    const link = $(body, '.entry-title')[0].children[0].attribs.href
                    const page = await getBody(link)
                    const table = $(page.body, 'table tbody tr a')
                    table.map(async function (i, download) {
                        const { attribs: { href }, children, parent } = download

                        await downloadFiles(href, 'ep', name.data.replace('► ', '') + i)
                    })
                }
            })
        })
    } catch (error) {
        console.error(error)
    }
}
console.time('Time Crawler')
crawler(URL_BASE)
console.timeEnd('Time Crawler')
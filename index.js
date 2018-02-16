const cheerio = require("cheerio")
const request = require("request")
const _ = require('lodash')
const fs = require("fs")
const URL_BASE = 'http://www.seriesintorrent.com/'
const proxy = process.env.HTTP_PROXY || ''//http://<user>:<password>@<host>:<port>/'

const getBody = (url) => {
    return new Promise((resolve, reject) => {
        request(url, { proxy }, (err, response, body) => {
            if (err) {
                reject(new Error(err))
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

const downloadFiles = async (url, path, nameFile) => {
    return request(url, { proxy })
    .on('error', (error) => console.error(error))
    .pipe(await fs.createWriteStream(`${path}/${nameFile.trim().replace('/','').replace('/','')}.rar`))
}

const crawler = async seriado => {
    await fs.exists(__dirname + '/ep', (exists) => {
        if (!exists) {
            fs.mkdir(__dirname + '/ep')
        }
    })
    await fs.exists(__dirname + '/ep/'+seriado, (exists) => {
        if (!exists) {
            fs.mkdir(__dirname + '/ep/'+seriado)
        }
    })
    try {
        const { body } = await getBody(URL_BASE)
        $(body, 'li a').map(function (i, element) {
            element.children.map(async name => {
                if (name.data.toLowerCase().includes(seriado)) {
                    const { href } = element.attribs
                    const { body } = await getBody(href)
                    const link = $(body, '.entry-title')[0].children[0].attribs.href
                    const page = await getBody(link)
                    const table = $(page.body, 'table tbody tr')
                    const obj = {}
                    table.map(async function (i, download) {
                        const { attribs: { href }, children, parent } = download
                        children.map(tag=>{
                            const episodio = tag.children
                            if(!!episodio){
                                if(!!episodio[0]){
                                    if(!!episodio[0].data ){
                                        obj.name = episodio[0].data
                                    }
                                    if(!!episodio[0].attribs){
                                        obj.link = episodio[0].attribs.href
                                    }
                                }
                            }
                            
                        })
                        if(obj.link){
                            await downloadFiles(obj.link.toString(), `ep/${seriado.toLowerCase()}`, name.data.replace('► ', '')+obj.name)
                        }
                    })
                }
            })
        })
    } catch (error) {
        console.error(error)
    }
}

crawler('chicago pd')

const { Builder, By, until} =  require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const cheerio = require('cheerio');
const async = require('async')
const screen = {
  width: 1000,
  height: 800
};
const fs = require('fs')

process.on('unhandledRejection', r => console.log("unhandledRejections",r));

let baseUrl = "https://www.google.com.au/maps/place/";
let places = ["Putney NSW 2112"]
let addr = '154.118.54.181:47992'
addr = '196.17.217.23:61488'

let capabilities = {
  'browserName' : 'Firefox',
  'browser_version' : '56.0 beta',
  'os' : 'OS X',
  'os_version' : 'Sierra',
  'resolution' : '1280x1024',
  'browserstack.user' : 'joshuaugba1',
  'browserstack.key' : 'BPgUs5oAcG82adRPvuZe',
  'browserstack.debug' : 'true',
  'build' : 'First build'
}
const crawl = (data) => {
  if(data.body.indexOf('https://www.google.com/maps') == -1) {
    
    return new Promise((resolve, reject)=>{
      resolve('no-maps!');
    })
  }
  // const driver = new Builder()
  //     .forBrowser('chrome')
  //     .build();
  let place = data.replacement;
  const driver = new Builder().forBrowser('chrome')
    .setChromeOptions(new chrome.Options()
    .addArguments(`--proxy-server=http://${addr}`)
    .headless()
    .windowSize(screen))
    .build();
  // const driver = new Builder().usingServer('http://hub-cloud.browserstack.com/wd/hub')
  //   .withCapabilities(capabilities)
  //   .build()
  driver.get(baseUrl + place).catch(e=>console.log("the main navigation failed!!"))
  driver.sleep(10000);
  return new Promise((resolve,reject)=> {
  driver.sleep(20000).then(() => { return driver.findElement(By.xpath('//*[@id="pane"]/div/div[1]/div/div/div[2]/div[1]/button[2]')).
      then((shareButton)=> {
        shareButton.click();
        driver.switchTo('')
      // driver.wait(until.elementLocated(By.css('#modal-dialog-widget > div.modal-container > div > div.modal-dialog-content > div > div > div.section-listbox > div.section-tab-bar > button.section-tab-bar-tab.ripple-container.section-tab-bar-tab-unselected')),1000).
        driver.sleep(30000).then(()=>{
        driver.findElement(By.css('#modal-dialog-widget > div.modal-container > div > div.modal-dialog-content > div > div > div.section-listbox > div.section-tab-bar > button.section-tab-bar-tab.ripple-container.section-tab-bar-tab-unselected')).
          then((embed)=>{
            embed.click();

          }).then(()=>{
              driver.findElement(By.tagName('body')).then(element=>{
                element.getAttribute("outerHTML").then(html=>{
                  $ = cheerio.load(html);
                  $('input').each((i, elm)=>{
                    if (i == 0){
                      if (elm.attribs.value.indexOf('iframe') == -1) reject(new Error("Iframe not found!"))
                      $$ = cheerio.load(elm.attribs.value)
                      driver.quit()
                      resolve($$('iframe').attr('src'))
                    }
                    })
                  }).catch((e)=>{
                    console.log('Error-1', e)
                    driver.takeScreenshot().then((data) =>{
                    let base64Data = data.replace(/^data:image\/png;base64,/, "")
                    fs.writeFile("screenshot-"+ Date.now()+ ".png", base64Data, 'base64', (err)=> {
                                  if (err) console.log("Error Saving Image: ",err)
                          })
                      })
                      driver.quit()
                      reject(e)
                  })
                }).catch((e)=>{
                  console.log('Error-2', e)
                  driver.takeScreenshot().then((data) =>{
                  let base64Data = data.replace(/^data:image\/png;base64,/, "")
                  fs.writeFile("screenshot-"+ Date.now()+ ".png", base64Data, 'base64', (err)=> {
                                if (err) console.log("Error Saving Image: ",err)
                        })
                    })
                    driver.quit()
                    reject(e)
                  })
              }).catch((e)=>{
                console.log('Error-3', e)
                driver.takeScreenshot().then((data) =>{
                let base64Data = data.replace(/^data:image\/png;base64,/, "")
                fs.writeFile("screenshot-"+ Date.now()+ ".png", base64Data, 'base64', (err)=> {
                              if (err) console.log("Error Saving Image: ",err)
                      })
                  })
                  driver.quit()
                  reject(e)
                })
        }).catch((e)=>{
          console.log('Error-4', e)
          driver.takeScreenshot().then((data) =>{
          let base64Data = data.replace(/^data:image\/png;base64,/, "")
          fs.writeFile("screenshot-"+ Date.now()+ ".png", base64Data, 'base64', (err)=> {
                        if (err) console.log("Error Saving Image: ",err)
                })
            })
            driver.quit()
            reject(e)
          })
        }).catch(e=>{
          console.log("error-before save", e)
            driver.takeScreenshot().then((data) =>{
            let base64Data = data.replace(/^data:image\/png;base64,/, "")
            fs.writeFile("screenshot-"+ Date.now()+ ".png", base64Data, 'base64', (err)=> {
                          if (err) console.log("Error Saving Image: ",err)
                  })
              })
            driver.quit()
            reject(e)
    })
  }).catch( e => {
      console.log('Failed to load first page', e)
      driver.takeScreenshot().then((data) =>{
      let base64Data = data.replace(/^data:image\/png;base64,/, "")
      fs.writeFile("screenshot-"+ Date.now()+ ".png", base64Data, 'base64', (err)=> {
                    if (err) console.log("Error Saving Image: ",err)
            })
        })
      driver.quit()
      reject(e)
  })

  })

}

const subvals = (data, subval) =>{
  return new Promise((resolve, reject)=>{
    $ = cheerio.load(data.body)
    let re2 = new RegExp(data.wordToReplace.toLowerCase(),"g")
    let replacement = data.replacement.split(' NSW')[0]
    $('a').each((i, elm) => {
      let href = elm.attribs.href
      elm.attribs.href = href.replace(re2,replacement.toLowerCase().split(' ').join('-'))
    })
    $('div').each((i, elm) => {
      try {
        let id =  elm.attribs.id
        elm.attribs.id = id.replace(re2, replacement.toLowerCase().split(' ').join('-'))
        console.log(elm.attribs)
      } catch (error) {
        
      }
      
    })
    $('iframe').each((i, elm) => {
      if(elm.attribs.src.indexOf('https://www.google.com/maps') > -1) elm.attribs.src = subval;
      // let outText = $.html();
      
      //resolve(outText);
    })
    $('a').each((i, elm) => {
      let text = $.html()
      let re = new RegExp('!--\\?',"g");
      let re1 = new RegExp('\\?--', "g");
      text = text.replace(re, '?');
      text = text.replace(re1, '?');
      resolve(text)
    })
  })
}

const callAgain = (place,cb, src) => {
  if(typeof src === 'string'){
    cb(src)
  }else callSub(place)
}
const callSub = (elem) => {
  return new Promise((resolve, reject) => {
    crawl(elem).then(callAgain.bind(elem,resolve)).catch(callSub.bind(null,elem))
  })
}
  
module.exports = {}
module.exports.subvals = subvals;
module.exports.crawl = crawl;

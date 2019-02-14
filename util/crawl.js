const { Builder, By, until} =  require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const cheerio = require('cheerio');
const async = require('async')
const screen = {
  width: 640,
  height: 480
};


process.on('unhandledRejection', r => console.log(r));

let baseUrl = "https://www.google.com.au/maps/place/";
let places = ["Putney NSW 2112"]

const crawl = (place) => {
  // const driver = new Builder()
  //     .forBrowser('chrome')
  //     .build();
  const driver = new Builder().forBrowser('chrome')
    .setChromeOptions(new chrome.Options()
    .headless()
    .windowSize(screen))
    .build();
  driver.get(baseUrl + place).catch(e=>console.log("the main navigation failed!!"))
  driver.sleep(1000);
  return new Promise((resolve,reject)=> {
    driver.findElement(By.xpath('//*[@id="pane"]/div/div[1]/div/div/div[2]/div[1]/button[2]')).
    then((shareButton)=> {
      shareButton.click();
      driver.switchTo('')
      // driver.wait(until.elementLocated(By.css('#modal-dialog-widget > div.modal-container > div > div.modal-dialog-content > div > div > div.section-listbox > div.section-tab-bar > button.section-tab-bar-tab.ripple-container.section-tab-bar-tab-unselected')),1000).
        driver.sleep(2000).then(()=>{
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
              driver.quit()
              reject(e)
            })
          }).catch((e)=>{
            driver.quit()
            reject(e)
          })
        }).catch((e)=>{
          driver.quit()
          reject(e)
        })
      }).catch((e)=>{
        driver.quit()
        reject(e)
      })
    }).catch(e=>{
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
    $('iframe').each((i, elm) => {
      elm.attribs.src = subval;
      let outText = $.html();
      let re = new RegExp('!--',"g");
      let re1 = new RegExp('--', "g");
      outText = outText.replace(re, '');
      outText = outText.replace(re1, '');
      resolve(outText);
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

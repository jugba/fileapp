const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const rimraf = require('rimraf')
const archiver = require('archiver');
const mkdirp = require('mkdirp');
const async = require('async')
const cheerio = require('cheerio')


const crawl = require('../util/crawl');
const ActivityLog = require('../models/activity_log');


var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads')
  },
  filename: (req, file, cb) => {
    console.log(file)
    //cb(null, file.fieldname + '-' + Date.now())
    cb(null,file.originalname)
  }
});
const upload = multer({storage: storage});



/* GET home page. */
router.get('/', function(req, res, next){
  res.render('index', { posts: {} });
});
router.get('/more', function(req,res, next){
  res.render('more');
})

router.get('/image', (req, res)=> {
    let context = req.cookies['context']
    console.log("download", context);
    res.clearCookie("context", {httpOnly: true})
    res.render('image', {download: context});
})

router.get('/downloads', (req, res) => {
  // clear all old archives
  rimraf('public/downloads/*.zip', (err)=>{
    if(err) console.log(err)
    let dir = __dirname.split("routes")
    // then zip all assets images and files
    let filename = `assets_${Date.now()}.zip`
    let filePath = dir[0] + 'public/downloads/'+ filename
    let output = fs.createWriteStream(filePath)
    let archive = archiver('zip', {
                            zlib: { level: 9 } 
                  })
    
    output.on('close', function() {
                    console.log(archive.pointer() + ' total bytes');
                    console.log('archiver has been finalized and the output file descriptor has closed.');
                    res.download(filePath);
                  })
                  
    output.on('end', function() {
                  console.log('Data has been drained');
              })
                  
    archive.on('warning', function(err) {
                    if (err.code === 'ENOENT') {
                      // log warning
                    } else {
                      // throw error
                      throw err;
                    }
                  })
                  
    archive.on('error', function(err) {
                    throw err;
                  })
                  
    archive.pipe(output)
    console.log(dir[0] + 'output/*.php')            
    //archive.glob('output/*.php')
    archive.directory('output/', false)
    archive.finalize().then(()=>{
      rimraf('output/', (err) => {
        if(err) console.log('Error purging Output dir', err)
        console.log('Emptied Output dir!')
        mkdirp('output/images', (err)=>{
          if (err) console.log('Error recreating Output dir', err)
          console.log('Done recreating dir')
        })

      })
      
    });
   
  })
})

router.post('/process_image', upload.array('fileupload'), (req, res) => {
  let wordToReplace = req.body.word
  wordToReplace = wordToReplace.toLowerCase()
  wordToReplace = wordToReplace.split(' ').join('-');
  let replacementsText = req.body.replacement
  let replacements = replacementsText.split('\r\n')
  
  let files = req.files
  if(files) {
    console.log('Uploading file...')
    async.eachOf(files, (file, key) => {
      let filename = file.filename;
      console.log("Filename: ", filename)
      let dir = __dirname.split("routes")
      fs.readFile(dir[0] + 'public/uploads/'+ filename, function(err, data){
        if(err){
        console.log(err)
        }else{

        for(let index = 0; index < replacements.length; index++){

          let re =  new RegExp(wordToReplace.toLowerCase(), "g")
          let element = replacements[index].trim()

          let newFilename = filename.replace(re, element.split(' ').join('-'))
          newFilename =  newFilename.toLowerCase()
          console.log("Creating copy for: ", element)
          console.log("New File Name: ", newFilename)
          fs.writeFile('output/' + newFilename, data, function(err){
            if (err){
              console.log("Error in writting to file")
            }
            if(key == files.length - 1 && index == replacements.length-1){
              downloadZip().then((download)=>{
                console.log(download)
                res.cookie("context", download, {httpOnly: true})
                res.redirect('/image')
              })
              
            }
          } )
        }
        }
      })

    }
    , 
    // (err) =>{
    //   if (err) console.log('Error getting all uploaded images.!', err)
    //   console.log('Done!')
    //   let download = downloadZip()
    //   res.cookie("context", download, {httpOnly: true})
    //   res.redirect('/image')

    // }
    )

   
  }
  //res.redirect('/image');
})

router.post('/extract', upload.single('fileupload'), function(req, res,next){
  const wordToReplace = req.body.word;
  let replacementsText = req.body.replacement;
  let filename='';
  let replacements =  replacementsText.split('\r\n');
  console.log(replacementsText);

  if(req.file) {
    console.log('Uploading file...');
    filename = req.file.filename;
    let dir = __dirname.split("routes")
    let re = new RegExp(wordToReplace,"g");
    console.log(dir);
    fs.readFile(dir[0] + 'public/uploads/'+ filename, function(err, data){
      if(err){
        console.log(err);
      }else{
        for (let index = 0; index < replacements.length; index++) {
          let elements = replacements[index]
          let element = elements.trim();
          let newtext =  data.toString().replace(re, element);
          let re2 = new RegExp(wordToReplace.toLowerCase(),"g");
          let newFilename = filename.replace(re2,element.toLowerCase().split(' ').join('-'));
          console.log("Creating copy for: ", element);
          let newEvent = new ActivityLog({
            replacement: element + " NSW",
            wordtoreplace: wordToReplace,
            body: newtext,
            status: 'created',
            url: newFilename
          })
          newEvent.save()
          console.log('Event',newEvent);
        }
      }
      
    })
  }else {
    console.log('No File uploaded...');
  }
  res.redirect('/more');
});

router.post('/upload', upload.single('fileupload'), function(req, res, next) {
  const wordToReplace = req.body.word;
  let replacementsText = req.body.replacement;
  let replacements =  replacementsText.split('\r\n');
  let filename='';

  if(req.file) {
    console.log('uploading File...');
    filename = req.file.filename;
    let dir = __dirname.split("routes")
    let re = new RegExp(wordToReplace, "g");
    console.log(dir);
    fs.readFile(dir[0] + 'public/uploads/'+ filename, function(err, data){
      if(err){
        console.log(err)
      }else{
        for (let index = 0; index < replacements.length; index++) {
          const element = replacements[index];
          let newtext =  data.toString().replace(re, element)
          let r = new RegExp(wordToReplace.toLowerCase(), "g");
          $ = cheerio.load(newtext)
          $('a').each((i, elm) => {
            let href = elm.attribs.href
            elm.attribs.href = href.replace(r, element.toLowerCase().split(' ').join('-'))
          })
          $('div').each((i, elm) => {
            try{
              let id = elm.attribs.id
              elm.attribs.id = id.replace(r, element.toLowerCase().split(' ').join('-'))
            } catch (error){

            }
          })
          $('a').each((i, elm) => {
            if (i > 0) return
            let text = $.html()
            let re = new RegExp('!--\\?', "g")
            let re1 = new RegExp('\\?--', "g")
            text = text.replace(re, '?')
            text = text.replace(re1, '?')
            newtext = text
            console.log(i, 'index')
  
          })
          let re2 = new RegExp(wordToReplace.toLowerCase(), "g")
          let newFilename = filename.replace(re2,element.toLowerCase())
          console.log("Creating copy for: ", element)
          fs.writeFile('output/'+newFilename, newtext, function(err){
            if(err){
              console.log('Error Creating new file!');
              console.log(err);
            }
          })
        }
      }
      
    })
  }else {
    console.log('No File uploaded...');
  }
  res.redirect('/');
  
})


const downloadZip = () => {
  return new Promise((resolve, reject)=>{
    rimraf('public/downloads/*.jpg', (err) =>{
      if (err) console.log('error deleting images', err);
      let dir = __dirname.split("routes")
      // then zip all assets images and files
      let filename = `images_${Date.now()}.zip`
      let filePath = dir[0] + 'public/downloads/'+ filename
      let output = fs.createWriteStream(filePath)
      let archive = archiver('zip', {
                              zlib: { level: 9 } 
                    })
      
      output.on('close', function() {
                      console.log(archive.pointer() + ' total bytes');
                      console.log('archiver has been finalized and the output file descriptor has closed.');
                      resolve(filename);
                    })
                    
      output.on('end', function() {
                    console.log('Data has been drained');
                })
                    
      archive.on('warning', function(err) {
                      if (err.code === 'ENOENT') {
                        // log warning
                      } else {
                        // throw error
                        throw err;
                      }
                    })
                    
      archive.on('error', function(err) {
                      throw err;
                    })
                    
      archive.pipe(output)
      //console.log(dir[0] + 'output/*.php')            
      archive.glob('output/*.jpg')
      archive.glob('output/*.jpeg')
      archive.glob('output/*.png')
      //archive.directory('output/', false)
      archive.finalize().then(()=>{
        rimraf('output/*.jpg', (err) => {
          if(err) console.log('Error purging Output dir', err)
          console.log('Emptied Output dir!')
          // mkdirp('output/images', (err)=>{
          //   if (err) console.log('Error recreating Output dir', err)
          //   console.log('Done recreating dir')
          // })
  
        })
        
      });
  
    })
  });
  
}
module.exports = router;

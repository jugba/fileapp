const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');

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
    res.render('image');
})

router.post('/process_image', upload.single('fileupload'), (req, res) => {
  const wordToReplace = req.body.word
  let replacementsText = req.body.replacement
  let filename = '';
  let replacements = replacementsText.split('\r\n')
  
  if(req.file) {
    console.log('Uploading file...')
    filename = req.file.filename;
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
          fs.writeFile('output/images/' + newFilename, data, function(err){
            if (err){
              console.log("Error in writting to file")
            }
          } )
        }
      }
    })

   
  }
  res.redirect('/image');
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
  let replacements = req.body.replacement;
  let filename='';
  if(req.file) {
    console.log('uploading File...');
    filename = req.file.filename;
    let dir = __dirname.split("routes")
    let re = new RegExp(wordToReplace,"g");
    console.log(dir);
    fs.readFile(dir[0] + 'public/uploads/'+ filename, function(err, data){
      if(err){
        console.log(err)
      }else{
        replacements = replacements.split(',');
        for (let index = 0; index < replacements.length; index++) {
          const element = replacements[index];
          let newtext =  data.toString().replace(re, element)
          let re2 = new RegExp(wordToReplace.toLowerCase(),"g")
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

module.exports = router;

const kue = require('kue')
, cluster = require('cluster')
, jobs = kue.createQueue();
// const mongoose = require('mongoose');
// mongoose.Promise = global.Promise;
// mongoose.connect('mongodb://localhost/node_kue', {useNewUrlParser: true});
const ActivityLog = require('../models/activity_log');
const fs = require('fs');

process.on('unhandledRejection', r => console.log(r));
const crawl = require('../util/crawl');

const clusterWorkerSize = require('os').cpus().length;

const subString = (data,done, newtext) => {
  fs.writeFile('output/'+ data.url, newtext, function(err){
    if(err){
      console.log('Error Creating new file!');
      console.log(err);
      return done(new Error(err));
    }else {
      setTimeout( () => {
        ActivityLog.findOne({'_id': data.id}, (err, event)=>{
          event.status = 'done';
          event.save();
        })
        console.log('Finished activity log jobs: ' + data.replacement);
        done();
      }, 100);
     
    }
  })
}
const processed = (data, crawl, done,src) => {
  if(typeof src === 'string'){
    crawl.subvals(data, src)
      .then(subString.bind(null, data, done))
  }else{
    console.log("Error getting mapps for: " + data.replacement)
    return done(new Error("Error getting mapps for: " + data.replacement));
  }
}

const failed = (done, err) => {
  return done(new Error(err));
}
if (cluster.isMaster) {
  kue.app.listen(3002);
  console.log("UI started on port 3002");
    for (let i = 0; i < 3; i++) {
      cluster.fork();
    }
}else {
  jobs.process('activity_log', 1, (job, done)=>{
    console.log('Starting ' + job.data.replacement);

    crawl.crawl(job.data)
            .then(processed.bind(null, job.data, crawl, done))
            .catch(failed.bind(null, done))
  });

  jobs.process('testing', 4, (job, done)=> {
      console.log('Starting '+ job.data.title);
      console.log("Execute testing jobs...");
      setTimeout(()=> {
        console.log( 'Finished ' + job.data.title);
        done();
      }, 1000);
  })
}

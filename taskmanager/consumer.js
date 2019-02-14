const kue = require('kue')
, jobs = kue.createQueue();

jobs.process('SubJob', (job, done)=> {
    console.log(job.data)

    setTimeout(()=>{
      console.log('processed task')
      done()
    }, 3000);
})
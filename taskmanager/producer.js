  const kue = require('kue')
    , jobs = kue.createQueue();

 
  let newFilename = 'eniston.php'
    , nameToReplace = 'Ryde'
    , replacement = 'Deniston NSW 2112, Australia'
    , textToProcess = 'Ryde was here <iframe src="here">';

  const createSubJob = (nameToReplace,replacement, textToProcess,newFilename) => {

    const job = jobs.create('SubJob', {
      nameToReplace,
      replacement,
      textToProcess,
      newFilename
    }).save();
    
    job.on('complete', function(){
      console.log('job subtitute for'+ replacement +' completed!')
    })
    job.on('failed', function(){
      console.log('job subtitute for'+ replacement +' failed!')
    })
     
  }   

setInterval(createSubJob.bind(null,nameToReplace,replacement, textToProcess,newFilename), 1000);
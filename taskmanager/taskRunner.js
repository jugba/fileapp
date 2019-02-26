const kue = require('kue')
, jobs = kue.createQueue();
const ActivityLog = require('../models/activity_log');
const async = require('async');


setInterval(()=>{
  events =  ActivityLog.find({status:'created'}, {}, (err, events)=>{
    async.each(events,(event)=>{
      console.log('Creating subtitute and write event for: '+ event.replacement)
      jobs.create('activity_log', {
        title: event.replacement,
        replacement: event.replacement,
        wordToReplace: event.wordtoreplace,
        body: event.body,
        url: event.url,
        id: event.id
      }).priority('high').attempts(6).save()
      event.status = 'added'
      event.save()
    })
  })
}, 5000)


const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/node_kue', {useNewUrlParser: true});
// mongoose.connect('mongodb://admin:qwerty13@ds161751.mlab.com:61751/onedatacom', {useNewUrlParser: true});

const activityLogSchema = new Schema({
  replacement: {type: String, require: true},
  wordtoreplace: String,
  body: String,
  status: String,
  url: String,
}, {
  timestamps: true
})

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
module.exports = ActivityLog;

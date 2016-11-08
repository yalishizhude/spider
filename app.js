var request = require('request');
var mongoose = require('mongoose');
var jsdom = require('jsdom');
var q = require('q');
mongoose.connect('mongodb://localhost:27017/lagou');
mongoose.connection.on('connected', function() {
  console.log('Mongoose connection successful.');
});
var pSchema = mongoose.Schema({
  positionId: String,
  companyFullName: String,
  positionName: String,
  workYear: String,
  salary: String,
  request: Array,
  resposibility: Array
});
var datestamp = (new Date()).toISOString().split('T').shift().replace(/-/g,'_');
var pModel = mongoose.model('position'+ datestamp, pSchema);
var random = 1000 * 10 * Math.random();

function query(pn) {
  if (!pn) return;
  request('http://www.lagou.com/jobs/positionAjax.json?px=default&yx=50k以上&needAddtionalResult=false', {
    form: {
      first: 1===pn,
      pn: pn || 1,
      kd: '技术总监'
    }
  }, function(err, res, body) {
    if (err) console.error(err);
    var obj = JSON.parse(body).content;
    var pageSize = obj.pageSize;
    var total = obj.positionResult.totalCount;
    var result = obj.positionResult.result;
    var jobDef = [];
    console.log('当前页%s,%s条数据', pn, result.length);
    result.forEach(function(item) {
      var def = q.defer();
      jobDef.push(def.promise);
      if(/技术总监|CTO|cto/.test(item.positionName)){
        setTimeout(function(position) {
          queryById(position).then(function(job) {
            var position = new pModel(job);
            position.save(function(err) {
              if (err) {
                def.reject(err);
              } else {
                def.resolve();
              }
            });
          });
        }, random, item);
      } else {
        def.resolve();
      }
    })
    pn++;
    q.all(jobDef).then(function() {
      if (pn * pageSize <= total) setTimeout(query(pn), random);
      else console.log('抓取完毕,总共%s条数据', total);
    });
  });
}

function queryById(position) {
  var def = q.defer();
  jsdom.env('http://www.lagou.com/jobs/' + position.positionId + '.html', [require('jquery')],
    function(err, window) {
      if (err) console.error(err);
      var $ = require('jquery')(window)
      position.resposibility = [];
      position.request = [];
      position.name = $('.clearfix.join_tc_icon>h1').attr('title');
      position.company = $('.clearfix.join_tc_icon>h1 div').text();
      $('.job_request>p>span:lt(3)').each(function(i) {
        var p = ['salary', 'city', 'year'];
        position[p[i]] = $(this).text();
      });
      var text = $('.job_bt').text().trim();
      var request = text.split(/职位要求/).pop().split('\n');
      var resposibility = text.split(/岗位职责/).pop().split(/职位要求/).shift().split('\n');
      resposibility.forEach(function(str) {
        if(str) position.resposibility.push(str);
      });
      request.forEach(function(str) {
        if(str) position.request.push(str);
      });
      console.log('当前职位', position);
      def.resolve(position);
    });
  return def.promise;
}
pModel.remove(function(){
  query(1);
});

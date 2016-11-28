// 发送http请求
var request = require('request');
// 连接mongodb
var mongoose = require('mongoose');
// 用来解析html
var jsdom = require('jsdom');
// promise模块
var q = require('q');
mongoose.Promise = q.Promise;
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
var datestamp = (new Date()).toISOString().split('T').shift().replace(/-/g, '_');
var pModel = mongoose.model('position' + datestamp, pSchema);
//设置随机时间 0~10秒，防止被反爬虫发现
var random = 1000 * 10 * Math.random();
//关键词
var keyword = '前端';
var history = [];

function query(pn) {
  pn = pn || 1;
  //薪水25k-50k
  request('http://www.lagou.com/jobs/positionAjax.json?px=default&yx=25k-50k&needAddtionalResult=false', {
    method: 'POST',
    form: {
      first: 1 === pn,
      pn: pn || 1,
      kd: keyword
    },
    headers: [{
      name: 'Content-Type',
      value: 'application/x-www-form-urlencoded',
    }, {
      name: 'User-Agent',
      value: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'
    }]
  }, function(err, res, body) {
    if (err) console.error(err);
    var obj = JSON.parse(body).content;
    var pageSize = obj.pageSize;
    var total = obj.positionResult.totalCount;
    var result = obj.positionResult.result;
    var jobDef = [];
    console.log('共%s条数据，当前页%s,%s条数据', total, pn, result.length);
    result.forEach(function(item) {
      var def = q.defer();
      jobDef.push(def.promise);
      if (item.positionName.indexOf(keyword) > -1 && history.indexOf(item.positionId) < 0) {
        history.push(item.positionId);
        // 模拟真实用户操作，防止被反爬虫封IP
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
      // 模拟真实用户操作，防止被反爬虫封IP
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
      //利用jquery解析dom
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
        if (str) position.resposibility.push(str);
      });
      request.forEach(function(str) {
        if (str) position.request.push(str);
      });
      console.log('当前职位', position);
      def.resolve(position);
    });
  return def.promise;
}
/*
程序入口
先注释step2，只执行step1，进行数据入库
再注释step1，只执行step2，查看分析结果
 */
/*
step1: 数据入库
*/
// pModel.remove(query);

/*
step2：分析结果
 */
// pModel.find({}).exec(function(err, data) {
//   if(err) throw err;
//   var total = data.length;
//   console.log('查询日期：%s\n关键词：前端\t25k-50k\t共%s条数据', datestamp, total);
//   pModel.find({request: /angular/ig}).exec(function(err, data) {
//     console.log('angular:\t%s\t%s%', data.length, (100*data.length/total).toFixed(2));
//   });
//   pModel.find({request: /react/ig}).exec(function(err, data) {
//     console.log('react  :\t%s\t%s%', data.length, (100*data.length/total).toFixed(2));
//   });
//   pModel.find({request: /vue/ig}).exec(function(err, data) {
//     console.log('vue    :\t%s\t%s%', data.length, (100*data.length/total).toFixed(2));
//   });
//   pModel.find({request: /jquery/ig}).exec(function(err, data) {
//     console.log('jquery :\t%s\t%s%', data.length, (100*data.length/total).toFixed(2));
//   });
// })

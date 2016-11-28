# 运行环境

* node.js
* mongodb

# 开始

1. 安装依赖
`npm i`

2. 启动本地mongodb数据库。

3. 找到“程序入口”，取消 step1 代码注释

```
/*
step1: 数据入库
*/
pModel.remove(query);
```

4. 执行命令

`node app.js`

5. step1执行完后，将其注释。取消step2 注释

```
/*
step2：分析结果
 */
pModel.find({}).exec(function(err, data) {
 if(err) throw err;
 var total = data.length;
 console.log('查询日期：%s\n关键词：前端\t25k-50k\t共%s条数据', datestamp, total);
 pModel.find({request: /angular/ig}).exec(function(err, data) {
   console.log('angular:\t%s\t%s%', data.length, (100*data.length/total).toFixed(2));
 });
 pModel.find({request: /react/ig}).exec(function(err, data) {
   console.log('react  :\t%s\t%s%', data.length, (100*data.length/total).toFixed(2));
 });
 pModel.find({request: /vue/ig}).exec(function(err, data) {
   console.log('vue    :\t%s\t%s%', data.length, (100*data.length/total).toFixed(2));
 });
 pModel.find({request: /jquery/ig}).exec(function(err, data) {
   console.log('jquery :\t%s\t%s%', data.length, (100*data.length/total).toFixed(2));
 });
})
```

6. 执行命令，查看结果
`node app.js`

*[原文地址](http://yalishizhude.github.io/2016/11/28/spider/)*

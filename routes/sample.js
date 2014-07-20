// 
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.sendToExample = function(req, res){
  res.render('example', { title: 'Express' });
};


var express = require('express');
var router = express.Router();

var checkLogin = require('../middlewares/check').checkLogin;

// GET /signout 登出
router.get('/', checkLogin, function(req, res, next) {
  //清空session中的用户信息
  req.session.user = null;
  req.flash('success','注销成功');
  //注销之后转到首页
  res.redirect('/posts');
});

module.exports = router;
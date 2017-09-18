var path = require('path');
var sha1 = require('sha1');
var express = require('express');
var router = express.Router();

var UserModel = require('../models/users');
var checkNotLogin = require('../middlewares/check').checkNotLogin;

// GET /signup 注册页
router.get('/', checkNotLogin, function(req, res, next) {
  res.render('signup');
});

// POST /signup 用户注册
router.post('/', checkNotLogin, function(req, res, next) {
  var name = req.fields.name;
  var gender = req.fields.gender;
  var bio = req.fields.bio;
  var avatar = req.files.avatar.path.split(path.sep).pop();
  var password = req.fields.password;
  var repassword = req.fields.repassword;

  //校验参数
  try{
    //name
    if(!(name.length>=1&&name.length<=6)){
      throw new Error('名字限制长度为6');
    }
    if(['m','f','x'].indexOf(gender) === -1){
      throw new Error('性别只能为男、女、保密');
    }
    if(password != repassword){
      throw new Error('两次密码输入不一致');
    }
    if (!req.files.avatar.name) {
      throw new Error('缺少头像');
    }
    if (password.length < 6) {
      throw new Error('密码至少 6 个字符');
    }
  }catch(e){
    req.flash('error', e.message);
    return res.redirect('/signup');
  }

  //明文加密
  password = sha1(password);

  //写入数据库的用户信息
  var user = {
    name: name,
    password: password,
    gender: gender,
    bio: bio,
    avatar: avatar
  };

  //用户信息写入数据库
  UserModel.create(user)
  .then(function(result){
    //此users是插入mongodb的值,包含_id
    user = result.ops[0];
    //将用户信息存入session
    delete user.password;
    req.session.user = user;
    //写入flash
    req.flash('success','注册成功');
    //跳转到首页
    res.redirect('/posts');
  })
  .catch(function(e){
    //用户名被占，调回注册页
    if( e.message.match('E11000 duplicate key')){
      req.flash('error','用户名已被占用');
      return res.redirect('/signup');
    }
    next(e);
  });
});

module.exports = router;
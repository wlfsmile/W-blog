var Post = require('../lib/mongo').Post;
var marked = require('marked');
var CommentModel = require('./comments');

//给post添加留言数commentCount
Post.plugin('addCommentCount',{
    afterFind: function(posts){
        return Promise.all(posts.map(function(post){
            return CommentModel.getCommentsCount(post._id).then(function(count){
                post.commentsCount = count;
                return post;
            })
        }))
    },
    afterFindOne: function(post){
        if(post){
            return CommentModel.getCommentsCount(post._id).then(function(count){
                post.commentsCount = count;
                return post;
            });
        }
        return post;
    }
})

//将post的content从markdown转换成HTML
Post.plugin('contentToHtml',{
    afterFind: function(posts){
        return posts.map(function(post){
            post.content = marked(post.content);
            return post;
        });
    },

    afterFindOne: function(post){
        if(post){
            post.content = marked(post.content);
        }
        return post;
    }
});

module.exports = {
    //创建一篇文章
    create: function create(post){
        return Post.create(post).exec();
    },

    //通过文章id获取一篇文章
    getPostById: function getPostById(postId){
        return Post.findOne({_id:postId}).populate({path:'author',model:'User'}).addCreatedAt().addCommentCount().contentToHtml().exec();
    },

    //按创建时间降序获取所有用户文章或某个特定用户的所有文章
    getPosts: function getPosts(author) {
        var query = {};
        if(author){
            query.author = author;
        }
        return Post
            .find(query)
            .populate({ path: 'author', model: 'User' })
            .sort({ _id: -1 })
            .addCreatedAt()
            .addCommentCount()
            .contentToHtml()
            .exec();
    },

    //通过文章id给pv+1
    incPv : function incPv(postId){
        return Post.update({_id:postId},{$inc:{pv:1}}).exec();
    },

    //通过id获取一篇原生文章（编辑）
    getRowPostById : function getRowPostById(postId){
        return Post.findOne({_id : postId}).populate({path: 'author',model: 'User'}).exec();
    },

    //通过用户id和文章id更新一篇文章
    updatePostById : function updatePostById(postId,author,data){
        return Post.update({ author: author, _id: postId }, { $set: data }).exec();
    },

    //通过用户id和文章id删除一篇文章
    delPostById : function delPostById(postId,author){
        return Post.remove({author: author, _id: postId}).exec().then(function(res){
            // 文章删除后，再删除该文章下的所有留言
            if (res.result.ok && res.result.n > 0) {
                return CommentModel.delCommentsByPostId(postId);
            }
        });
    }
};
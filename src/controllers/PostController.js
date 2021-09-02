const Posts = require('../models').Posts;
const Tags = require('../models').Tags;
const slugify = require('slugify');
module.exports = {
    async add(req, res) {
        try {
            const {tags,title,description,user_id} = req.body;
            const slug=slugify(
                title,
                { lower:true, remove:'', separator:'-', trim:true }
            );
            const post=await Posts.create({
                title:title,
                description:description,
                slug:slug,
                created_by: user_id,
            });
            const tagdata=[];
            tags.forEach((value,key)=>{
                tagdata.push({
                    post_id:post.id,
                    tag_id:value
                });
            });

            await Posts.addTags(tagdata);
            return res.status(200).send({
                success: true,
                data: post,
                message: 'Post added',
            });
        } catch (e) {
            res.status(400).send({
                success: false,
                message: e.message,
            });
        }
    },

    async detail(req, res) {
        try {
            const {id}=req.params;
            const details = await Posts.findByPk(id);

            return res.status(200).send({
                success: true,
                message: 'Post details.',
                data:details,
            });
        } catch (e) {
            return res.status(400).send({
                success: false,
                data: [],
                message: e.message,
            });
        }
    },

    async list(req, res) {
        let {page,limit,tags,params}=req.query;
        const where={
            active:1
        };
        params=(params!==undefined?params.split(','):['id','title','description','slug','created_at']);
        const innerwhere=(tags!==undefined ? { id:tags.split(',')} : {});

        Posts.findAll({
            attributes:params,
            where:where,
            include:[{
                model:Tags,
                as:'tags',
                attributes:['id','title','details'],
                where:innerwhere
            }]
        }).then((data) => {
            res.status(200).send({
                success: true,
                data:data,
                message: 'Posts fetched',
            });
        })
        .catch((e) => {
            res.status(400).send({
                success: false,
                data: [],
                message:e.message,
            });
        });
    },

    async update(req, res) {}
};
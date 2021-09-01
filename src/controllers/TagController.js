const Tags = require('../models').Tags;
const response = {
    success: true,
    message: 'success',
    data: [],
};
module.exports = {
    async list(req, res, next) {
        const {params} = req.query;
        const attr = (params !== undefined ? params.split(",") : ['id','title','details','created_by']);
        Tags.findAll({
            attributes:attr,
        })
        .then((result) => {
            response.success = true;
            response.data = result;
            response.message = 'Tags listed';
            res.status(200).json(response);
        })
        .catch((err) => {
            response.success = false;
            response.data = [];
            response.message = err.message;
            res.status(400).json(response);
        });
    },

    async add(req, res, next) {
        try {

            let {title,details,user_id} = req.body;
            const tags = await Tags.create({
                title:title,
                details:details,
                created_by: user_id,
            });

            return res.status(200).send({
                success: true,
                message: 'Tag added successfully',
                data: tags,
            });
        } catch (err) {
            response.success = false;
            response.message = err.message;
            return res.status(404).json(response);
        }
    },

    async update(req, res, next) {
        try {
            let {id,title,details,user_id} = req.body;
            await Tags.update({
                title:title,
                details:details,
                updated_by: user_id,
            }, {
                where: {
                    id:id,
                },
            });
            response.success = true;
            response.data = {
                title:title,
                details:details,
                updated_by: user_id,
            };
            response.message = 'Tag Updated successfully.';
            return res.status(200).json({
                ...response,
                status: 200,
            });
        } catch (err) {
            response.success = false;
            response.message = err.message;
            return res.status(404).json(response);
        }
    },

    async detail(req, res, next) {
        const {id}=req.params;
        console.log(req.params);
        Tags.findByPk(id,{
            attributes: [
                'id',
                'title',
                'details',
                'updated_by',
                'created_by',
                'updated_at',
                'created_at'
            ],
            raw:true,
            plain:true
            // include: [{
            //         model: TabParameters,
            //         as: 'ticket_status',
            //         attributes: ['param_value', 'param_description'],
            //     },
            // ],
        })
        .then((result) => {
            if (result) {
                response.success = true;
                response.data = result;
                response.message = 'Tag details fetched.';
            } else {
                response.success = false;
                response.message = 'No Details Found';
                response.data = [];
            }
            res.status(200).json(response);
        })
        .catch((err) => {
            response.success = false;
            response.data = [];
            response.message = err.message;
            res.status(400).json(response);
        });
    },
};

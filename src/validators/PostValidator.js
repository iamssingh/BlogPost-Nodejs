const joi = require('joi');
const sequelize = require('sequelize');

const addPostValidation = async(req, res, next) => {
    const addPostValidationSchema = joi.object({
        title: joi.string().required(),
        description: joi.string().required(),
        tags: joi.array().required(),
    });
    const data = req.body;
    try {
        await addPostValidationSchema.validateAsync(data, {
            allowUnknown: true,
        });
    } catch (err) {
        if (err) {
            return res.status(422).json({
                success: false,
                message: err.message,
                data: [],
            });
        }
    }
    next();
};

const updatePostValidation = async(req, res, next) => {
    const updatePostValidationSchema = joi.object({
        id: joi.number().required(),
        title: joi.string().required(),
        description: joi.string().optional(),
        tags: joi.array().optional(),
    });
    const data = req.body;
    try {
        await updatePostValidationSchema.validateAsync(data, {
            allowUnknown: true,
        });
    } catch (err) {
        if (err) {
            return res.status(422).json({
                success: false,
                message: err.message,
                data: [],
            });
        }
    }
    next();
};

module.exports = {
    addPostValidation,
    updatePostValidation
};
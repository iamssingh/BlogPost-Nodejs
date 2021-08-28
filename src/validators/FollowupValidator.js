const joi = require('joi');
const sequelize = require('sequelize');

const addServiceValidation = async(req, res, next) => {
    const services = joi.object().keys({
        service_group_id: joi.number().required(),
        sub_service_id: joi.number().optional(),
        service_id: joi.number().required(),
        name: joi.string().optional(),
        category: joi.string().allow('independent','non-haz','haz','per-man-hour','per-suite','per-gallon','per-unit').required(),
        price: joi.number().precision(2).optional(),
        tax: joi.number().optional(),
        price_valid_from: joi.string().required(),
        price_valid_till: joi.string().required(),
        remark: joi.string().optional(),
    });
    
    const addServiceValidationSchema = joi.array().items(services);

    const data = req.body.services;
    try {
        await addServiceValidationSchema.validateAsync(data, {
            allowUnknown: true,
            convert: false
        });
    } catch (err) {
        if (err) {
            return res.status(422).json({
                success: false,
                message: err.details[0].message,
                data: [],
            });
        }
    }
    next();
};

const updateServiceValidation = async(req, res, next) => {
    const updateServiceSchema = joi.object({
        id: joi.number().required(),
        price: joi.number().precision(2).optional(),
        tax: joi.number().optional(),
    });
    
    const data = req.body;
    try {
        await updateServiceSchema.validateAsync(data, {
            allowUnknown: true,
            convert: false
        });
    } catch (err) {
        if (err) {
            return res.status(422).json({
                success: false,
                message: err.details[0].message,
                data: [],
            });
        }
    }
    next();
};
module.exports = {
    addServiceValidation,
    updateServiceValidation
};
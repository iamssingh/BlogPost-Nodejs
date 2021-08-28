const joi = require('joi');
const sequelize = require('sequelize');

const addYardValidation = async(req, res, next) => {
    const addYardValidationSchema = joi.object({
        client_id: joi.number().required(),
        name: joi.string().required(),
        address: joi.string().optional(),
        coordinates: joi.array().required(),
    });
    const data = req.body;
    try {
        await addYardValidationSchema.validateAsync(data, {
            allowUnknown: true,
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

const yardActionValidation = async(req, res, next) => {
    const yardActionValidationSchema = joi.object({
        images: joi.array().required(),
        note: joi.string().empty(''),
        services: joi.array().required(),
        datetime: joi.number().empty(''),
        status: joi.number().required(),
        ticket_id: joi.number().required(),
    });
    const data = req.body;
    try {
        await yardActionValidationSchema.validateAsync(data, {
            allowUnknown: true,
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
const updateYardValidation = async(req, res, next) => {
    const updateYardValidationSchema = joi.object({
        id: joi.number().required(),
        name: joi.string().required().optional(),
        address: joi.string().empty(''),
        coordinates: joi.array().required().optional(),
    });
    const data = req.body;
    try {
        await updateYardValidationSchema.validateAsync(data, {
            allowUnknown: true,
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

const yardTicketCompleteValidation = async(req, res, next) => {
    const yardTicketCompleteValidationSchema = joi.object({
        images: joi.array().required(),
        note: joi.string().empty(''),
        details: joi.array().required(),
        ticket_id: joi.number().required(),
    });
    const data = req.body;
    try {
        await yardTicketCompleteValidationSchema.validateAsync(data, {
            allowUnknown: true,
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
    addYardValidation,
    updateYardValidation,
    yardActionValidation,
    yardTicketCompleteValidation
};
const joi = require('joi');
const sequelize = require('sequelize');

const addUserValidation = async (req, res, next) => {
  const addUserSchema = joi.object({
    username: joi.string().required(),
    first_name: joi.string().required(),
    middle_name: joi.string().required(),
    last_name: joi.string().required(),
    password: joi.string().empty(''),
    email: joi.string().email().optional().empty(),
    role_id: joi.string().required(),
    user_photo: joi.string().empty(''),
    mobile: joi.string().empty(''),
    timezone: joi.string().empty(''),
    address: joi.string().empty(''),
  });
  const data =
    req.body.userdetails != undefined ? req.body.userdetails : req.body;
  try {
    await addUserSchema.validateAsync(data, {
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

// const usernameValidation = async(req, res, next) => {
//     const usernameVallidationSchema = joi.object({
//         username: joi.string().min(6).required(),
//     });
//     try {
//         let usernameRemoteData = {
//             table: 'users_mst',
//             field: 'username',
//             entity: 'username',
//             type: 'unique',
//             isNullAllowed: false,
//             model: Users,
//         };
//         if (req.body.id != undefined) {
//             usernameRemoteData['except'] = {
//                 field: 'id',
//                 value: req.body.id,
//             };
//         }

//         remoteChecks(
//                 usernameRemoteData,
//                 req.body.username,
//                 res,
//                 next
//             )
//             .then((resultCount) => {
//                 if (resultCount > 0) {
//                     throw Error('Username is not unique!');
//                 }
//                 const data = req.body;
//                 usernameVallidationSchema.validateAsync(data, {
//                     allowUnknown: true,
//                 });
//                 next();
//             })
//             .catch((err) => {
//                 return res.status(422).json({
//                     success: false,
//                     message: `${err.message}`,
//                     data: [],
//                 });
//             });
//     } catch (err) {
//         let message =
//             ((typeof err === 'object' && err.details != undefined) ? err.details[0].message : err);
//         message = (message != '' ? message : err.message);
//         return res.status(422).json({
//             success: false,
//             message: `${message}`,
//             data: [],
//         });
//     }
// };

const loginValidation = async (req, res, next) => {
  const loginValidationSchema = joi.object({
    username: joi.string().required(),
    password: joi.string().required(),
  });
  try {
    const data = req.body;
    await loginValidationSchema.validateAsync(data, {
      allowUnknown: true,
    });
  } catch (err) {
    return res.status(422).json({
      success: false,
      message: err.message,
      data: [],
    });
  }
  next();
};

const registerValidation = async (req, res, next) => {
  const registerValidationSchema = joi.object({
    username: joi.string().required(),
    email: joi.string().required(),
    name: joi.string().required(),
    password: joi.string().required(),
    profile_pic: joi.string().optional()
  });
  try {
    const data = req.body;
    await registerValidationSchema.validateAsync(data, {
      allowUnknown: true,
    });
  } catch (err) {
    return res.status(422).json({
      success: false,
      message: err.message,
      data: [],
    });
  }
  next();
};
module.exports = {
  loginValidation,
  registerValidation
};

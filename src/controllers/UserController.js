const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path=require('path');
const Users = require('../models').Users;
const UserTxns = require('../models').UserTxns;
const UserDetail = require('../models').UserDetails;
const ClientMst = require('../models').ClientMst;
const TabParam = require('../models').TabParameters;
const { Op } = require('sequelize');
// const upload = multer({dest:'uploads/'});
const upload = multer({dest:'uploads/'}).single('profile_pic')
const response = {
  success: false,
  message: 'success',
};

module.exports = {
  async generateToken(user) {
    const token = await jwt.sign(
      {
        data: {
          user_id: user.user_id,
          client_id: user.client_id,
          first_name: user.first_name,
          last_name: user.last_name,
          middle_name: user.middle_name,
          email: user.email,
          username: user.username,
          role_id: user.role_id,
        },
      },
      process.env.JWT_SECRET
    );
    return token;
  },

  async updateToken(id, token, callback) {
    User.findByPk(id)
      .then((user) => {
        if (!user) {
          throw new Error('user not found');
        }

        user
          .update({
            api_token: token,
          })
          .then(() => {
            callback({ ...user.dataValues });
          });
      })
      .catch((error) => {
        throw new Error(error);
      });
  },

  async update(req, res) {
    const updatedId = req.body.id;
    const userId = req.body.user_id;
    const clientID = req.body.client_id;
    delete req.body['id'];
    delete req.body['roleId'];
    delete req.body['user_id'];
    delete req.body['client_id'];
    if (req.body.password) {
      const salt = bcrypt.genSaltSync(8);
      const hash = bcrypt.hashSync(req.body.password, salt);
      req.body.password = hash;
    }

    try {
      const userUpdated = await User.update(
        {
          ...req.body,
          updated_by: userId,
        },
        {
          where: {
            user_id: updatedId,
          },
        }
      );

      await UserDetail.update(
        {
          ...req.body,
          updated_by: userId,
        },
        {
          where: {
            user_id: updatedId,
          },
        }
      );
      await UserTxns.create({
        parameter_name: 'user_updated',
        parameter_value: updatedId,
        remark: 'user data updated',
        flag: 0,
        created_by: userId,
        client_id: clientID != undefined ? req.body.client_id : null,
        user_id: updatedId,
      }).then((userTxns) => {
        return res.status(200).json({
          message: 'User updated successfully.',
          success: true,
          data: userUpdated,
        });
      });
    } catch (err) {
      response.success = false;
      response.message = err;
      return res.status(404).json(err.message);
    }
  },

  async userLogin(req, res) {
    try {
      let {email,password} = req.body;

      let user = await Users.findOne({
        where: {
          [Op.or]: [
            { username: email },
            email.length >= 6 && { email: email },
          ],
        },
      });

      if (!user) {
        return res
          .status(200)
          .send({ success: false, data: [], message: 'User not found' });
      }

      let same = await bcrypt.compareSync(password, user.password);

      if (!same) {
        return res.status(200).send({
          data: [],
          message: 'User password does not match',
          success: false,
        });
      }

      const client = await ClientMst.findOne({
        where: {
          client_id: user.client_id,
        },
      });
      if (user.status === 0) {
        return res.status(200).send({
          message: 'user is deactivated',
          success: false,
          data: [],
        });
      }

      if (client && client.status === 0) {
        return res.status(200).send({
          message: 'user is deactivated',
          success: false,
          data: [],
        });
      } else {
        const token = await module.exports.generateToken(user);
        response.success = true;
        response.message = 'success';
        // console.log('data role-id', user.dataValues.role_id);
        // if (user.dataValues.role_id == 99) {
        //   TabParam.findAll({
        //     attributes: [
        //       'id',
        //       'param_name',
        //       'param_key',
        //       'param_value',
        //       'param_description',
        //     ],
        //   }).then((res) => {
        //     console.log(res.dataValues);
        //     response.data['tab_params'] = res;
        //   });
        // }
        const tabParam = await TabParam.findAll({
          attributes: [
            'param_name',
            'param_key',
            'param_value',
            'param_description',
            'parent_id'
          ],
        });

        const UpdatedUserData = async (userData) => {
          if (client) {
            const userInfo = await UserDetail.findOne({
              where: {
                user_id: user.user_id,
              },
              attributes: ['mobile', 'address', 'user_photo'],
              raw: true,
            });
            if (userInfo) {
              response.data = { ...userData, TabParams: tabParam, ...userInfo };
            } else {
              response.data = { ...userData, TabParams: tabParam };
            }

            response.data['clientCompany'] = client.company_name;
            response.data['logo'] = client.logo;
            response.data['invoice_logo'] = client.invoice_logo;
            response.data['washout_certification_logo'] = client.washout_certification_logo;
          } else {
            response.data = userData;
          }
          await UserTxns.createTxns(
            'user_logged_in',
            userData.user_id,
            'user logged in',
            0,
            userData.client_id,
            userData.user_id,
            userData.user_id
          );
          // await UserTxns.create({
          //     parameter_name: 'user_logged_in',
          //     parameter_value: userData.user_id,
          //     remark: 'user logged in',
          //     flag: 0,
          //     client_id: userData.client_id,
          //     created_by: userData.user_id,
          //     user_id: userData.user_id,
          // });

          res.status(200).send({ ...response });
        };

        await module.exports.updateToken(user.user_id, token, UpdatedUserData);
      }
    } catch (err) {
      response.message = err.message;
      res.status(400).send(response);
    }
  },

  async userSignUp(req, res) {
    try {
      upload(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
          // A Multer error occurred when uploading.
          response.success = false;
          response.message = err.message;
          return res.status(400).json();
        } else if (err) {
          // An unknown error occurred when uploading.
          response.success = false;
          response.message = err.message;
          return res.status(400).json();
        }

        // Everything went fine.
        const {username,email,password,profile_pic} = req.body;
        const filename=(req.file.path)+(path.extname(req.file.originalname));

        const alreadyExist = await Users.count({
          where:{
            [Op.or]: [{email:email},{username:username}],
          }
        });
  
        if (alreadyExist>0) {
          response.success = false;
          response.message = 'User already exists!';
          return res.status(400).json(response);
        }
  
        const salt = bcrypt.genSaltSync(8);
        const data=req.body;
        data.password = bcrypt.hashSync(password, salt);
  
        let userdata = await Users.create({
          ...data,
          active: 1,
          profile_pic: filename!==undefined ? filename : null,
          role:'user'
        });
        response.success = true;
        response.data = userdata;
        response.message = 'User added successfully.';
        return res.status(200).json({ ...response });

      });
    } catch (err) {
      response.success = false;
      response.message = err.message;
      return res.status(400).json();
    }
  },

  async imageUpload(req, res) {
    try {
      if (req.file.location == undefined) {
        throw Error('File could not be uploaded.');
      }
      res.status(200).json({
        success: true,
        data: { filepath: req.file.location },
        message: 'Image Uploaded.',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        data: [],
        message: error.message,
      });
    }
  },

  async getUserList(req, res) {
    try {
      const userList = await User.findAll({
        where: {
          client_id: req.body.client_id,
        },
        attributes: [
          'middle_name',
          'last_name',
          'first_name',
          'email',
          'username',
          'user_id',
          'client_id',
          'role_id',
          'status',
        ],
        include: [
          {
            model: UserDetail,
            as: 'user_details',
            attributes: ['mobile', 'address', 'user_photo'],
          },
        ],
      });

      res
        .status(200)
        .send({ data: userList, message: 'user list data', success: true });
    } catch (e) {
      res.status(400).send({
        success: false,
        data: [],
        message: e.message,
      });
    }
  },

  async changeStatus(req, res) {
    try {
      const userId = req.query.id;
      const status = req.query.status;

      await User.update(
        {
          status: status,
          updated_by: req.body.user_id,
        },
        {
          where: {
            user_id: userId,
            client_id: req.body.client_id,
          },
        }
      );
      await UserTxns.create({
        parameter_name: 'user_status_changed',
        parameter_value: userId,
        remark: parseInt(status) === 0 ? 'user deactivated' : 'user activated',
        flag: 0,
        client_id: req.body.client_id ? req.body.client_id : 0,
        created_by: req.body.user_id,
        user_id: userId,
      });

      res.status(200).send({
        message: 'status changed successfully',
        data: [],
        success: true,
      });
    } catch (e) {
      res.status(400).send({
        success: false,
        data: [],
        message: e.message,
      });
    }
  },

  async changeClientStatus(req, res) {
    try {
      const status = req.query.status;
      const clientId = req.query.clientId;
      const userId = req.body.user_id;

      await ClientMst.update(
        {
          status: status,
          updated_by: req.body.user_id,
        },
        {
          where: {
            client_id: clientId,
          },
        }
      );

      res.status(200).send({
        message: 'client status changed successfully',
        data: [],
        success: true,
      });
    } catch (e) {
      res.status(400).send({
        success: false,
        data: [],
        message: e.message,
      });
    }
  },

  async detail(req, res, next) {
    if (req.params.id == undefined) {
      response.success = false;
      response.message = 'User id is required';
      return res.status(400).json(response);
    }
    User.findOne({
      where: { user_id: req.params.id },
      attributes: [
        'user_id',
        'username',
        'email',
        'first_name',
        'middle_name',
        'last_name',
        'client_id',
        'client_cust_id',
        'role_id',
        'status',
        'last_login_at',
      ],
      raw: true,
      include: [
        {
          model: UserDetail,
          as: 'user_details',
          attributes: ['mobile', 'user_photo', 'address'],
        },
      ],
    })
      .then((result) => {
        result.mobile = result['user_details.mobile'];
        result.user_photo = result['user_details.user_photo'];
        result.address = result['user_details.address'];
        delete result['user_details.mobile'];
        delete result['user_details.user_photo'];
        delete result['user_details.address'];
        response.success = true;
        response.data = result;
        response.message = 'User details fetched.';
        res.status(200).json(response);
      })
      .catch((err) => {
        response.success = false;
        response.data = [];
        response.message = err.message;
        res.status(400).json(response);
      });
  },

  async changePassword(req, res) {
    try {
      const userID = req.params.userId ? req.params.userId : req.body.user_id;
      const clientID = req.body.client_id;
      const salt = bcrypt.genSaltSync(8);
      const hash = bcrypt.hashSync(req.body.password, salt);
      await User.update(
        {
          password: hash,
          updated_by: req.body.user_id,
        },
        {
          where: {
            user_id: userID,
            client_id: clientID,
          },
        }
      );

      await UserTxns.createTxns(
        'password_changed',
        userID,
        'User password changed.',
        0,
        clientID,
        req.body.user_id,
        userID
      );
      res
        .status(200)
        .send({ message: 'Changed password success', success: true });
    } catch (e) {
      response.success = false;
      response.data = [];
      response.message = e.message;
      res.status(400).json(response);
    }
  },

  async FindPrimaryUser(req, res) {
    try {
      const clientID = req.params.clientID;
      const primaryUser = await User.findOne({
        where: {
          client_id: clientID,
        },
      });

      return res.status(200).send({
        success: true,
        message: primaryUser ? 'primary user found' : 'primary user not found',
        data: primaryUser,
      });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },
};

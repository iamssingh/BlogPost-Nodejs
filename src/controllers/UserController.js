const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path=require('path');
const Users = require('../models').Users;
const { Op } = require('sequelize');
// const upload = multer({dest:'uploads/'});
const upload = multer({dest:'uploads/'}).single('profile_pic')
const response = {
  success: false,
  message: 'success',
  data: [],
};

module.exports = {
  async generateToken(user) {
    const token = await jwt.sign(
      {
        data: {
          user_id: user.id,
          username: user.username,
          role_id: user.role_id,
        },
      },
      process.env.JWT_SECRET
    );
    return token;
  },

  async updateToken(id, token, callback) {
    Users.findByPk(id)
      .then((user) => {
        if (!user) {
          throw new Error('User not found');
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
    let {id,name,email,password} = req.body;
    if (password) {
      const salt = bcrypt.genSaltSync(8);
      password = bcrypt.hashSync(password, salt);
    }

    try {
      const userdata = await Users.update(
        {
          name:name,
          email:email,
          password:password
        },
        {
          where: {
            id:id,
          },
        }
      );
      return res.status(200).json({
        message: 'User updated successfully.',
        success: true,
        data: userdata,
      });
    } catch (err) {
      response.success = false;
      response.message = err.message;
      return res.status(404).json(response);
    }
  },

  async userLogin(req, res) {
    try {
      let {email,password} = req.body;
      response.success = false;
      response.data = [];
      response.message = 'Username or password does not match';

      let user = await Users.findOne({
        where: {
          [Op.or]: [
            { username: email },
            email.length >= 6 && { email: email },
          ],
        },
      });

      if (!user) {
        return res.status(200).send(response);
      }

      let same = await bcrypt.compareSync(password, user.password);

      if (!same) {
        return res.status(200).send(response);
      }

      if (user.active === 0) {
        response.message='User is deactivated';
        return res.status(200).send(response);
      }

      user.api_token = await module.exports.generateToken(user);
      await user.save();
      response.success = true;
      response.message = 'success';
      response.data = user;
      res.status(200).send(response);
      // await module.exports.updateToken(user.user_id, user.api_token, UpdatedUserData);
    } catch (err) {
      response.message = err.message;
      res.status(400).send(response);
    }
  },

  async userSignUp(req, res) {
    try {
      response.success = false;
      response.data = [];
      upload(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
          // A Multer error occurred when uploading.
          response.message = err.message;
          return res.status(400).json(response);
        } else if (err) {
          // An unknown error occurred when uploading.
          response.message = err.message;
          return res.status(400).json(response);
        }

        // Everything went fine.
        const {username,email,password} = req.body;
        const filename=(req.file.path)+(path.extname(req.file.originalname));

        const alreadyExist = await Users.count({
          where:{
            [Op.or]: [{email:email},{username:username}],
          }
        });
  
        if (alreadyExist>0) {
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
      return res.status(400).json(response);
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
      const list = await Users.findAll({
        attributes: [
          'name',
          'email',
          'username',
          'id',
          'role_id',
          'active',
          'profile_pic',
        ],
      });
      res.status(200).send({ data: list, message: 'User listed.', success: true });
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
      const {id,status} = req.query;
      await Users.update(
        {
          active: status
        },
        {
          where: {
            id: id
          },
        }
      );
      res.status(200).send({
        message: 'User status updated.',
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
    const {id}=req.params;
    Users.findOne({
      where: { id: id },
      attributes: [
        'id',
        'username',
        'email',
        'name',
        'active'
      ],
      raw: true,
      // include: [
      //   {
      //     model: UserDetail,
      //     as: 'user_details',
      //     attributes: ['mobile', 'user_photo', 'address'],
      //   },
      // ],
    })
      .then((result) => {
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
      const {id,password} = req.body;
      const salt = bcrypt.genSaltSync(8);
      const hash = bcrypt.hashSync(password, salt);
      await Users.update(
        {
          password: hash,
        },
        {
          where: {
            id: id
          },
        }
      );

      res
        .status(200)
        .send({ message: 'Changed password success', success: true,data:[] });
    } catch (e) {
      response.success = false;
      response.data = [];
      response.message = e.message;
      res.status(400).json(response);
    }
  },
};

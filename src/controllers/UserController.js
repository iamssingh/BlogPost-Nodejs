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

  async update(req, res, next) {
    let {user_id,name,email,password} = req.body;
    if (password) {
      const salt = bcrypt.genSaltSync(8);
      password = bcrypt.hashSync(password, salt);
    }

    try {
      await Users.update(
        {
          name:name,
          email:email,
          password:password
        },
        {
          where: {
            id:user_id,
          },
        }
      );
      return res.status(200).json({
        message: 'User updated successfully.',
        success: true,
        data: {
          name:name,
          email:email,
          password:password
        },
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
            { email: email },
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
      const {user_id,status} = req.body;
      await Users.update(
        {
          active: status
        },
        {
          where: {
            id: user_id
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
    const id=req.params.id===undefined ? req.body.user_id : req.params.id;
    Users.findByPk(id,{
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
      const {user_id,old_password,new_password} = req.body;

      const user = await Users.findByPk(user_id);

      let same = await bcrypt.compareSync(old_password, user.password);

      if(!same){
        throw Error("The old password id wrong.");
      }

      const salt = bcrypt.genSaltSync(8);
      const hash = bcrypt.hashSync(new_password, salt);
      await Users.update(
        {
          password: hash,
        },
        {
          where: {
            id: user_id
          },
        }
      );

      res
        .status(200)
        .send({ message: 'Password Changed.', success: true,data:[] });
    } catch (e) {
      response.success = false;
      response.data = [];
      response.message = e.message;
      res.status(400).json(response);
    }
  },
};

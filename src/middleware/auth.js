const jwt = require('jsonwebtoken');
let basepath = process.env.INIT_CWD + '/src/';
const Users = require(basepath + 'models').Users;

const response = {
  success: false,
  message: '',
  data: [],
};
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    let user;
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        response.message = err.message;
        return res.status(422).json(response);
      }
      user = await Users.findAll({
        where: [
          {
            id: decoded.data.user_id,
            api_token: token,
          },
        ],
      });

      if (user.length > 0) {
        req.body.id = decoded.data.user_id;
        req.body.role = decoded.data.role;
        return next();
      } else {
        response.message = 'Your token is invalid.';
        return res.status(401).json(response);
      }
    });
  } catch (e) {
    response.message = e.message;
    return res.status(401).send(response);
  }
};

module.exports = {
  authMiddleware,
};

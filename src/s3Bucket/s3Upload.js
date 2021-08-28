var aws = require('aws-sdk');
var multer = require('multer');
var multerS3 = require('multer-s3');

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  bucket: process.env.AWS_BUCKET,
  acl: 'public-read',
  region: process.env.AWS_DEFAULT_REGION,
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET,
    acl: 'public-read',
    contentDisposition: 'attachment',
    metadata: function(req, file, cb) {
      console.log(file.fieldname);
      cb(null, { fieldName: file.fieldname });
    },
    key: function(req, file, cb) {
      let n = file.originalname.lastIndexOf('.');
      var type = file.originalname.substring(n + 1, file.originalname.length);

      cb(null, `${Date.now().toString()}.${type}`);
    },
  }),
  fileFilter(req, file, cb) {
    cb(undefined, true);
  },
});

const deleteimage = async (req, res, next) => {
  s3.deleteObject(
    {
      Bucket: process.env.AWS_BUCKET,
      Key: req.body.url,
    },
    function(err, data) {
      response = {};
      if (err) {
        response.success = false;
        response.message = err.message;
        response.data = [];
        return res.status(400).json(response);
      }
      if (data) {
        response.success = true;
        response.message = 'Deleted.';
        response.data = [];
        return res.status(200).json(response);
      }
    }
  );
};

module.exports = {
  upload,
  s3,
  deleteimage,
};

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.Cloudinary_CloudName,
    api_key: process.env.Cloudinary_API,
    api_secret: process.env.Cloudinary_Secret
  });

  module.exports = cloudinary;
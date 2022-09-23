const querystring = require('querystring'); // Don't install.
const AWS = require('aws-sdk'); // Don't install.
const Sharp = require('sharp');
const {filterRawFile} = require('./filter');
const dcraw = require('dcraw');

const S3 = new AWS.S3({
  region: 'ap-northeast-2'
});
const BUCKET = 'senipio-storage-c8c5b6bb164226-new';

exports.handler = async (event, context, callback) => {
  const { request, response } = event.Records[0].cf;
  // Parameters are w, h, f, q and indicate width, height, format and quality.
  const params = querystring.parse(request.querystring);

  // Required width or height value.
  if (!params.w && !params.h) {
    return callback(null, response);
  }

  // Extract name and format.
  const { uri } = request;
  const [, imageName, extension] = uri.match(/\/?(.*)\.(.*)/);

  // Init variables
  let width;
  let height;
  let format;
  let fit;
  let quality; // Sharp는 이미지 포맷에 따라서 품질(quality)의 기본값이 다릅니다.
  let s3Object;
  let resizedImage;

  // Init sizes.
  width = parseInt(params.w, 10) ? parseInt(params.w, 10) : null;
  height = parseInt(params.h, 10) ? parseInt(params.h, 10) : null;
  fit = params.fit ? params.fit : 'inside';

  // Init quality.
  if (parseInt(params.q, 10)) {
    quality = parseInt(params.q, 10);
  }

  // Init format.
  format = params.f ? params.f : extension;
  format = format === 'jpg' ? 'jpeg' : format;

  // For AWS CloudWatch.
  console.log(`parmas: ${JSON.stringify(params)}`); // Cannot convert object to primitive value.
  console.log(`name: ${imageName}.${extension}`); // Favicon error, if name is `favicon.ico`.

  try {
    s3Object = await S3.getObject({
      Bucket: BUCKET,
      Key: decodeURI(imageName + '.' + extension)
    }).promise();
  } catch (error) {
    console.log('S3.getObject: ', error);
    return callback(error);
  }

  let imageUrl = s3Object.Body;
  if (filterRawFile(extension)) {
    const buf = new Uint8Array(s3Object.Body);
    const thumbnail = dcraw(buf, { extractThumbnail: true });
    const blob = new Blob([thumbnail], { type: "image/jpeg" });
    const urlCreator = window.URL || window.webkitURL;
    imageUrl = urlCreator.createObjectURL(blob);
  }

  try {
    resizedImage = await Sharp(imageUrl)
      .resize(width,height,{fit:fit})
      .toFormat(format, {
        quality
      })
      .toBuffer();
  } catch (error) {
    console.log('Sharp: ', error);
    return callback(error);
  }

  const resizedImageByteLength = Buffer.byteLength(resizedImage, 'base64');
  console.log('byteLength: ', resizedImageByteLength);

  // `response.body`가 변경된 경우 1MB까지만 허용됩니다.
  if (resizedImageByteLength >= 1 * 1024 * 1024) {
    return callback(null, response);
  }

  response.status = 200;
  response.body = resizedImage.toString('base64');
  response.bodyEncoding = 'base64';
  response.headers['content-type'] = [
    {
      key: 'Content-Type',
      value: `image/${format}`
    }
  ];
  return callback(null, response);
};
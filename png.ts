const fs = require('fs');
const PNG = require('pngjs').PNG;
const QRCode = require('qrcode');
const Utils = require('qrcode/lib/renderer/utils');
const { qrToImageData, hex2rgba } = require('./utils');

export function render (qrData, options) {
  const opts = Utils.getOptions(options);
  // 单独添加而外的属性
  opts.randomColor = options.randomColor;

  console.log(opts);
  const pngOpts = opts.rendererOpts;
  const size = Utils.getImageWidth(qrData.modules.size, opts);

  pngOpts.width = size;
  pngOpts.height = size;

  const pngImage = new PNG(pngOpts);
  qrToImageData(pngImage.data, qrData, opts);
  return pngImage;
}

export function renderToBuffer (text, options = {}) {
  return new Promise((resolve, reject) => {
    const qrData = QRCode.create(text, options);

    const png = render(qrData, options);
    const buffer = [];

    png.on('error', function (err) {
      reject(err);
    });

    png.on('data', function (data) {
      buffer.push(data);
    });

    png.on('end', function () {
      resolve(Buffer.concat(buffer));
    });

    png.pack();
  });
}

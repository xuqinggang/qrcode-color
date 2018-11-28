const { getScale } = require('qrcode/lib/renderer/utils');

export function qrToImageData (imgData, qr, opts) {
  // different version(1~40) have different different size
  // version 1 : 21 * 21
  // version 2 : 25 * 25
  const size = qr.modules.size;
  // data每个元素表示每个module的色值,0白色，1黑色；总共size * size个module
  const data = qr.modules.data;
  // 每个modules，所占据多少像素
  // scale = x ( per module have x pixel)
  const scale = getScale(size, opts);
  // 生成图片后的像素
  const symbolSize = Math.floor((size + opts.margin * 2) * scale);
  const scaledMargin = opts.margin * scale;
  const palette = [opts.color.light, opts.color.dark];
  // console.log(size, scale, symbolSize, palette, data.length, data[0], data[8], data[12], data[13]);

  // console.log('opts', opts.randomColor);
  // 横轴i, 纵轴j，遍历的是每个像素值
  for (let i = 0; i < symbolSize; i++) {
    for (let j = 0; j < symbolSize; j++) {
      let posDst = (i * symbolSize + j) * 4;
      let pxColor = opts.color.light;

      if (i >= scaledMargin && j >= scaledMargin &&
        i < symbolSize - scaledMargin && j < symbolSize - scaledMargin) {
        // 每个module位置
        const iSrc = Math.floor((i - scaledMargin) / scale);
        const jSrc = Math.floor((j - scaledMargin) / scale);
        pxColor = palette[data[iSrc * size + jSrc] ? 1 : 0];

        if (opts.randomColor && (
          judgeIsCanColor(iSrc, jSrc, data, size) ||
          judgeFinderPattern(i, j, {
            margin: opts.margin,
            size,
            scale,
          })
        )
        ) {
          pxColor = hex2rgba(opts.randomColor);
        }
      }

      // img元素填充rgba,每4个元素为一个像素
      imgData[posDst++] = pxColor.r;
      imgData[posDst++] = pxColor.g;
      imgData[posDst++] = pxColor.b;
      imgData[posDst] = pxColor.a;
    }
  }
}

export function hex2rgba (hex) {
  if (typeof hex !== 'string') {
    throw new Error('Color should be defined as hex string');
  }

  let hexCode = hex.slice().replace('#', '').split('');
  if (hexCode.length < 3 || hexCode.length === 5 || hexCode.length > 8) {
    throw new Error('Invalid hex color: ' + hex);
  }

  // Convert from short to long form (fff -> ffffff)
  if (hexCode.length === 3 || hexCode.length === 4) {
    hexCode = Array.prototype.concat.apply([], hexCode.map(function (c) {
      return [c, c];
    }));
  }

  // Add default alpha value
  if (hexCode.length === 6) hexCode.push('F', 'F');

  const hexValue = parseInt(hexCode.join(''), 16);

  return {
    r: (hexValue >> 24) & 255,
    g: (hexValue >> 16) & 255,
    b: (hexValue >> 8) & 255,
    a: hexValue & 255,
    hex: '#' + hexCode.slice(0, 6).join(''),
  };
}

// 判断x, y像素是否处在 定位标识
export function judgeFinderPattern(i, j, opts) {
  const { margin, size, scale } = opts;
  const ll = (margin + 2) * scale;
  const llPlus2 = (margin + 5) * scale;
  const rr = (margin + size - 5) * scale;
  const rrPlus2 = (margin + size - 2) * scale;
  if (
    (ll <= i && i < llPlus2 && ll <= j && j < llPlus2) ||
    (rr <= i && i < rrPlus2 && ll <= j && j < llPlus2) ||
    (ll <= i && i < llPlus2 && rr <= j && j < rrPlus2)
  ) {
    return true;
  }
  return false;
}

// 随机上色(把周围8个module都是白色的,中间module上色)
export function judgeIsCanColor(iSrc, jSrc, data, size) {
  return iSrc >= 1 && jSrc >= 1 && iSrc <= (size - 1) && jSrc <= (size - 1) && (
    [-1, 0, 1].every(i => {
      return [-1, 0, 1].every(j => {
        const aroundModule = (iSrc + i) * size + (jSrc + j);
        // 周围都是0
        return (i === 0 && j === 0) || !data[aroundModule];
      });
    })
  );
}

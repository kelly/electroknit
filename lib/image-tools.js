'use strict';

const pngparse       = require('pngparse');
const jimp           = require('jimp');
const config         = require('../config');

const imageTools = {
  _createImageData(image) {
    let buf = new Buffer(image.width * image.height * 4);

    let l = image.data.length;
    let pos = 0;
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        buf.writeUInt32BE(image.getPixel(x, y), pos);
        pos += 4;
      }
    }

    image.data = buf;

    return image;
  },

  _resizeIfNeeded(filename, width, callback) {
    let maxWidth = (width == 'auto') ? config.machine.maxNeedles : width;
    let image = jimp.read(filename, function (err, image) {
      if (err) return callback(err);

      let width = (image.bitmap.width > maxWidth) ? maxWidth : image.bitmap.width;
      image
        .resize(width, jimp.AUTO)
        .getBuffer(jimp.MIME_PNG, callback)
    });
  },

  convertTo2dPixels(filename, options, callback) {
    imageTools.convertToPixels(filename, options, function(err, pixels, pimage) {     
      if (err) return callback(err);

      let cols = pimage.width,
          rows = pimage.height,
          pixels2d = new Array(new Array());
      for (let i = 0; i < rows; i++) {
        pixels2d[i] = pixels.splice(0, cols);
      }

      callback(err, pixels2d);
    })
  },

  // modified from https://github.com/noopkat/png-to-lcd. 
  convertToPixels(filename, options, callback) {
    imageTools._resizeIfNeeded(filename, options.width, function(err, data) {
      pngparse.parse(data, function(err, img) {
        if (err) return callback(err);
       
        let pimage = imageTools._createImageData(img);

        let pixels = pimage.data,
            pixelsLen = pixels.length,
            height = pimage.height,
            width = pimage.width,
            threshold = 120,
            pixelArray = [],
            depth = 4;

        if (options.dither) {
          imageTools.floydSteinberg(pimage, options.ditherThreshold);
        }

        for (let i = 0; i < pixelsLen; i += depth) {
          // red value
          let pixelVal = pixels[i + 1] = pixels[i + 2] = pixels[i];
          pixelVal = (pixelVal > threshold) ? config.encoding.stitchOff : config.encoding.stitchOn;
          pixelArray[i/depth] = pixelVal;
        }
        
        callback(err, pixelArray, pimage);
      });
    });
  },
  // https://github.com/noopkat/floyd-steinberg/blob/master/floyd-steinberg.js
  floydSteinberg(image, threshold) {
    let imageData = image.data;
    let imageDataLength = imageData.length;
    let w = image.width;
    let lumR = [],
        lumG = [],
        lumB = [];

    let newPixel, err;

    for (let i = 0; i < 256; i++) {
      lumR[i] = i * 0.299;
      lumG[i] = i * 0.587;
      lumB[i] = i * 0.110;
    }

    // Greyscale luminance (sets r pixels to luminance of rgb)
    for (let i = 0; i <= imageDataLength; i += 4) {
      imageData[i] = Math.floor(lumR[imageData[i]] + lumG[imageData[i+1]] + lumB[imageData[i+2]]);
    }

    for (let currentPixel = 0; currentPixel <= imageDataLength; currentPixel += 4) {
      // threshold for determining current pixel's conversion to a black or white pixel
      newPixel = imageData[currentPixel] < threshold ? 0 : 255;
      err = Math.floor((imageData[currentPixel] - newPixel) / 23);
      imageData[currentPixel] = newPixel;
      imageData[currentPixel + 4         ] += err * 7;
      imageData[currentPixel + 4 * w - 4 ] += err * 3;
      imageData[currentPixel + 4 * w     ] += err * 5;
      imageData[currentPixel + 4 * w + 4 ] += err * 1;
      // Set g and b pixels equal to r (effectively greyscales the image fully)
      imageData[currentPixel + 1] = imageData[currentPixel + 2] = imageData[currentPixel];
    }
    return image;
  }

}

module.exports = imageTools;
'use strict';

const EventEmitter = require('events');
const config = require('../config');
const path = require('path');
const imageTools = require('./image-tools');
const _ = require('underscore');

class Pattern extends EventEmitter {

  constructor(imagePath, options) {
    super()

    this.imagePath = imagePath;
    this.imageFilename = path.basename(imagePath);

    options = options || {};

    _.defaults(options, {
      topOffset       : 0,
      rightOffset     : 'auto',
      width           : 'auto',
      dither          : false,
      repeat          : false,
      ditherThreshold : 120
    });

    _.extend(this, options);

    this.render();
  }

  row(idx) {
    return this.pattern[idx];
  }

  rowsCount() {
    return this.pattern.length + this.topOffset;
  }

  formattedRow(idx) {
    let row;
    if (idx < this.topOffset){
      row = this._paddedRow();
    } else {
      row = this._pad(this.row(idx - this.topOffset));
    }
    return row;
  }

  formattedPattern() {
    let rows = []
    for (let i = 0; i < this.rowsCount(); i++) {
      rows.push(this.formattedRow(i));
    }
    return rows;
  }

  render(callback) {
    const options = _.pick(this, 'width', 'dither', 'ditherThreshold');
    imageTools.convertTo2dPixels(this.imagePath, options, (err, pixels) => {
      if (!err) {
        this.pattern = pixels;
        this._configureSizing();
        this.emit('loaded', pixels)
      }

      if (callback) callback(err, pixels);
    });
  }

  isLoaded() {
    return !_.isUndefined(this.pattern);
  }

  _configureSizing() {
    this.height = this.pattern.length;

    if (this.width == 'auto') {
      this.width = _.first(this.pattern).length;
    }

    if (this.rightOffset == 'auto') {
      this.rightOffset = Math.floor((config.machine.maxNeedles - this.width) / 2);
    }
  }

  _repeat(pattern) {
    // TODO
  }

  _paddedRow() {
    const emptyPixel = config.encoding.stitchOff;
    return new Array(config.machine.maxNeedles).fill(emptyPixel);
  }

  _pad(patternRow) {
    if (this.width >= 200) return patternRow;

    const emptyPixel = config.encoding.stitchOff;
    const leftCols  = new Array(config.machine.maxNeedles - (this.rightOffset + this.width)).fill(emptyPixel);
    const rightCols = new Array(this.rightOffset).fill(emptyPixel);

    patternRow = leftCols.concat(patternRow).concat(rightCols);

    return patternRow;
  }
}

module.exports = Pattern;
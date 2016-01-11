'use strict';

const EventEmitter = require('events');
const Serial = require('./Serial');
const config = require('../config');
const _ = require('underscore');

class Machine extends EventEmitter {
  constructor(options) {
    super();

    options = options || {};

    _.defaults(options, {
      debug: false,
      leftEndStitch: config.machine.leftEndStitch,
      rightEndStitch: config.machine.rightEndStitch
    });

    _.extend(this, options);

    this.currentRow = -1;
    
    this._setupSerial();
  }

  start(pattern) {
    if (this.isKnitting) return;
    this.isKnitting = true;

    if (pattern) {
      this.pattern = pattern;
    }

    if (this.pattern.isLoaded()) { 
      this.startNextRow();
    } else {
      this.pattern.once('loaded', (pixels) => {
        this.startNextRow();
      });
    }

    this.io.on('read:sensors', this._update.bind(this));
  }

  stop() {
    if (!this.isKnitting) return;
    this.isKnitting = false;

    this.io.removeAllListeners('read:sensors');
  }

  startNextRow() {
    this.currentRow++;
    this.startRow(this.currentRow);
  }

  startRow(row) {
    if (row >= this.pattern.rowsCount()) {
      this.emit('finished');
      return;
    }
    this.currentRow = row;
    this.emit('update:row', this.currentRow);

    const patternRow = this.pattern.formattedRow(this.currentRow);
    this.io.sendPatternRow(patternRow);
  }

  _setupSerial() {
    this.io = new Serial({ 
      debug: this.debug,
      port: this.port
    });
    this.io.on('open', () => {
      this.emit('ready');
    });
  }

  _update(sensorData) {
    this.emit('update:sensors', sensorData);
    _.extend(this, sensorData);

    const dirLeft = config.encoding.headDirectionLeft;
    const dirRight = config.encoding.headDirectionRight;

    // start left side 
    if ((sensorData.headDirection == dirLeft) && 
        (sensorData.stitch >= this.leftEndStitch) &&
        (this.lastDirection != dirLeft)) {
      this.lastDirection = dirLeft;
      this.startNextRow();
    }

    // start right side 
    if ((sensorData.headDirection == dirRight) && 
        (sensorData.stitch <= this.rightEndStitch) &&
        (this.lastDirection != dirRight)) {
      this.lastDirection = dirRight;
      this.startNextRow();
    }
  }

  static sharedMachine() {
    if (!Machine._sharedMachine) {
      Machine._sharedMachine = new Machine();
    }
    return Machine._sharedMachine;
  }
}


module.exports = Machine;
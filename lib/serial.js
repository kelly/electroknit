'use strict';

const SerialPort = require('serialport');
const EventEmitter = require('events');
const config = require('../config');
const _ = require('underscore');
const arduinoPortReg = /usb|acm|^com/i;

class Serial extends EventEmitter {

	constructor(options) {
		super();

		options = options || {};
  	_.defaults(options, {
  		debug: false,
  		responseTimeout: 1000,
  		retryInterval: 100
  	});

  	_.extend(this, options);

		this.serialBuffer = '';
		this._tryConnection();
  }

  sendPatternRow(patternRow) {
  	this.lastSentData = patternRow;
  	this.serialPort.write(config.serial.lineTerminator);
		this.serialPort.write(patternRow);
		this.serialPort.write(config.serial.footer);
	}

	emit(msg, data) {
		super.emit(msg, data);
		if (this.debug) {
			console.log(msg + (_.isUndefined(data) ? '' : data.toString()));
		}
	}

  detect(callback) {
    SerialPort.list((err, ports) => {
      let arduino, all;

      all = ports.map(function(val) {
        return val.comName;
      });

    	arduino = all.filter(function(val) {
    		let available = true;
        if (!arduinoPortReg.test(val)) {
          available = false;
        }
        return available;
    	});

    	this.ports = {
    		all: all,
    		arduino: arduino
    	}

    	this.emit('detect:ports', this.ports);

      callback(this.ports);
    });
  }

  connect(port) {
		this.serialPort = new SerialPort.SerialPort(port, {
		  baudrate: config.serial.baudrate
		});
		this.serialPort.on('open', this._didOpenPort.bind(this));
		this.serialPort.on('data', this._receivedData.bind(this));
		this.serialPort.on('close', this.close.bind(this));
  }

  isConnected() {
  	return this.serialPort && this.serialPort.isOpen();
  }

  close() {
  	if (this.serialPort.isOpen()) this.serialPort.close();
  	this.ports.connection = null;
  	this.emit('close');
  }

	_tryConnection() {
  	if (this.port) {
			this.connect(this.port);
		} else {
			this.detect((ports) => {
				let arduino = ports.arduino[0];
				if (arduino && !this.isConnected()) {
					this.connect(arduino);
				}
			});
		}
  }

  _didOpenPort() {
  	this.serialPort.flush();
  	this.ports.connection = this.port || this.serialPort.path;
  	setTimeout(() => {
  		this.emit('open');
  	}, 2000)
  }

	_receivedData(data) {
		this.lastReceivedDate = Date.now();
		this.serialBuffer += this._sanitize(data);

		if (this._isValidResponse(data)) {

			// TODO: this is a bad way to check different between messages. 
			// Fix in the the knitic arduino code.
			if (this.serialBuffer.length > config.machine.maxNeedles) {
				this._receivedPatternData(this.serialBuffer);
			} else {
				this._receivedSensorData(this.serialBuffer);
			}
			this.serialBuffer = ''; // clear
		} 
	}

	_receivedSensorData(data) {
		const sensors = data.split(',').map(_.partial(parseInt, _, 10));
		const pos = config.encoding.dataPosition;
		const sensorData = {
			stitch        :  sensors[pos.stitch],
			headDirection :  sensors[pos.headDirection],
			shift         :  sensors[pos.shift],
			lastReceived  :  this.lastReceivedDate
		}

		this.emit('read:sensors', sensorData);
	}

	_receivedPatternData(data) {
		// validate recipt
		if(!this._isValidPatternResponse(data)) {
			setTimeout(() => {
				this.sendPatternRow(this.lastSentData);
			}, this.retryInterval);
			this.emit('error:pattern', data);
		} else {
			this.emit('success:pattern', data);
		}
	}

	_isValidResponse(data) {
		data = data.toString().trim();
		return (data[data.length - 1] == config.serial.lineTerminator);
	}

	_sanitize(data) {
		return data.toString().trim().replace(config.serial.lineTerminator, '');
	}

	_isValidPatternResponse(data) {
		return (_.isEqual(data.trim(), this.lastSentData.join('')) && 
			(Date.now() - this.lastReceivedDate) < this.responseTimeout);
	}
}

module.exports = Serial;
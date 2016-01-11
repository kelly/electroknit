#!/usr/bin/env node
'use strict';
require('babel-core/register');

const Electroknit = require('../main');
const config      = require('../config')
const program     = require('commander');
const chalk       = require('chalk');
const _           = require('underscore');
const color = {
	'machine' : chalk.cyan,
	'pattern' : chalk.magenta,
	'machine:knitting' : chalk.yellow,
	'maching:knitting:bg' : chalk.black.bgYellow.bold
}

program
 	.description('')
  .option('-i, --image <path>')
  .option('-p, --port <path>', 'arduino usb path')
  .option('-o, --offset <n>', 'offset from right', parseInt)
  .option('-d, --dither', 'enable dither image')
  .option('-r, --repeat', 'repeat the pattern (not supported currently)')
  .parse(process.argv);

if (!program.image) {
  console.error('-i image required, use --help for more options');
 	process.exit(1);
}

let machine = new Electroknit.Machine({port: program.port});
machine.on('ready', function() {
	let pattern = new Electroknit.Pattern(program.image, {dither: program.dither});
	machine.start(pattern);

	log('machine', {'port' : machine.io.ports.connection});

	pattern.on('loaded', function() {
		log('pattern', _.pick(pattern, 'dither', 'width', 'repeat'))
	});

	machine.on('update:sensors', function(data) {
		log('machine:knitting', _.pick(machine, 'stitch', 'headDirection', 'currentRow'), true);
	});
});


let log = function(source, msg, clearLine) {
	let msgStr = color[source](source) + chalk.grey(': ');
	if (_.isString(msg)) {
		msgStr += chalk.grey(msg);
	} else {
		_.each(msg, function(val, key) {
			let valString;
			if (_.isBoolean(val)) {
				valString = (val) ? 'on' : 'off';
			} else if(_.isNumber(val)) {
				valString = val.toString();
			} else {
				valString = val;
			}
			msgStr += (chalk.grey(key + ':') + chalk.white(valString) + ' ');
		});
	}
	if (clearLine) {
		process.stdout.clearLine();
  	process.stdout.cursorTo(0);
  	process.stdout.write(msgStr);
	} else {
  	console.log(msgStr);
	}
}
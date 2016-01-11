# Electroknit

A javascript library for knitting machines. Currently works with [knitic](http://www.knitic.com) boards. Future plans to support OpenKnit and other platforms. 

## Install

````bash
$ npm install electroknit -g
````

## Usage

```bash
$ electroknit -i 'test.jpg' -o 100 -d 
````

```javascript 
const Electroknit = require('electroknit');

let machine = new Electroknit.Machine();
let pattern = new Electroknit.Pattern('test.jpg');

machine.on('ready', function() {

  machine.start(pattern);

  machine.on('update:sensors', function(data) {
    console.log(data);
  });
});

````

## App

I've built an Electron app to use with this module that makes it easy to visualize your knitting process. (Coming Soon!)
- [Github](#)
- [OSX Binary](#)
- [Windows Binary](#)

## Questions?

http://www.twitter.com/korevec
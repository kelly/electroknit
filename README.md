# Electroknit

A javascript library for knitting machines. Currently works with [knitic](http://www.knitic.com) boards. Future plans to support OpenKnit and other platforms. 

## Install

````bash
$ npm install electroknit -g
````

## Usage

```
Usage: electroknit [options]

Options:

  -h, --help          output usage information
  -i, --image <path>  
  -p, --port <path>   arduino usb path
  -o, --offset <n>    offset from right
  -d, --dither        enable dither image
  -r, --repeat        repeat the pattern (not supported currently)
```

## Examples

```bash
$ electroknit -i 'test.jpg' -o 100 -d 
````

```javascript 
const Electroknit = require('electroknit');

let machine = new Electroknit.Machine(); // will auto-detect device
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

- [Github](https://github.com/kelly/electroknit-app)
- [OSX Binary](https://github.com/kelly/electroknit-app/raw/master/binary/Electroknit-darwin-x64.zip)

![Electroknit App](http://i.imgur.com/9AxJI3u.png)

## Questions?

http://www.twitter.com/korevec
const config = {
  'machine' : {
    'maxNeedles' : 200,
    'leftEndStitch' : 200,
    'rightEndStitch' : -18
  },
  'serial' : {
    'baudrate' : 115200,
    'lineTerminator': '@',
    'footer': '&',
  },
  'encoding': {
    'headDirectionLeft': -1,
    'headDirectionRight': 1,
    'stitchOn': 0,
    'stitchOff': 1,
    'dataPosition': {
      'stitch': 1,
      'headDirection': 2,
      'shift': 3
    }
  }
}

module.exports = config;
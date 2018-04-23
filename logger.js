// simple logger

var Logger = function() {
  this.LogLevel = Object.freeze({'ERROR': 5, 'WARN': 4, 'INFO': 3, 'DEBUG': 2, 'DEV': 1});
  this.level = this.LogLevel.INFO;
  
  this.getLogLevel = function() {
    return this.level;
  };
  
  this.setLogLevel = function(lvl) {
    if(Object.values(this.LogLevel).indexOf(lvl) < 0) {
      this.warn('Invalid LogLevel. LogLevel not changed');
      return;
    }
    
    this.level = lvl;
    var level_label = Object.keys(this.LogLevel).find(key => this.LogLevel[key] === lvl);
    console.log('LOG LEVEL SET TO ' + level_label);
  };
  
  this.error = function(msg) {
    logMsg(this.LogLevel, this.level, this.LogLevel.ERROR, msg);
  };
  
  this.warn = function(msg) {
    logMsg(this.LogLevel, this.level, this.LogLevel.WARN, msg);
  };
  
  this.info = function(msg) {
    logMsg(this.LogLevel, this.level, this.LogLevel.INFO, msg);
  };
  
  this.debug = function(msg) {
    logMsg(this.LogLevel, this.level, this.LogLevel.DEBUG, msg);
  };
  
  this.dev = function(msg) {
    logMsg(this.LogLevel, this.level, this.LogLevel.DEV, msg);
  };
  
  // private function
  var logMsg = function(log_lvl, set_lvl, req_lvl, msg) {
    if(req_lvl >= set_lvl) {
      var level_label = Object.keys(log_lvl).find(key => log_lvl[key] === req_lvl);
      
      // log objects separately for easy viewing in browser
      if(msg !== null && typeof msg === 'object') {
        console.log(level_label + ' ->');
        console.log(msg);
      }
      else {
        console.log(level_label + ' -> ' + msg);
      }
    }
  };
};

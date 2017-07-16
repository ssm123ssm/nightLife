module.exports = function() {
  return function(req, res, next) {
    
      res.sendFile('index.html');
  }
  next();
}
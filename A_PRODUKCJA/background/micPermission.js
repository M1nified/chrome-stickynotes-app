$(document).ready(function(){console.log("READY"),navigator.getUserMedia=navigator.webkitGetUserMedia||navigator.mozGetUserMedia,navigator.webkitGetUserMedia({audio:!0},function(o){console.log("GRANTED"),o.stop()},function(){console.log("DENIED")})});
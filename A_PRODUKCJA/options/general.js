$(document).ready(function(){var e=window.location.href.match(/\w+\.html/i)[0];$(".menu1>a[href='"+e+"']").addClass("current"),loadImage("img1","https://www.paypalobjects.com/en_US/GB/i/btn/btn_donateCC_LG.gif"),loadImage("img2","https://www.paypalobjects.com/en_US/GB/i/btn/btn_donateCC_LG.gif")});var loadImage=function(e,t){var n=new XMLHttpRequest;n.responseType="blob",n.onload=function(){try{document.getElementById(e).src=window.URL.createObjectURL(n.response)}catch(t){}},n.open("GET",t,!0),n.send()};
'use strict';
function getSingleElementByClassName(className) {
  return document.getElementsByClassName(className)[0];
}

function replaceInnerInClass(className, text) {
  var theClass = getSingleElementByClassName(className);
  theClass.innerHTML = '';
  theClass.appendChild(document.createTextNode(text));
}

function appendTextToClass(className, text) {
  getSingleElementByClassName(className).appendChild(document.createTextNode(text));
}

function replaceTextInClass(className, text) {
  replaceInnerInClass(className, '');
  appendTextToClass(className, text);
}

function getQueryParam(paramName) {
  var url = window.location.href;
  var queryString = url.split('?');
  queryString = queryString[queryString.length-1];
  var params = queryString.split('&');
  for (var i = 0; i < params.length; i++) {
    var splitPair = params[i].split('=');
    if (splitPair[0] === paramName) {
      return splitPair[1];
    }
  }
};

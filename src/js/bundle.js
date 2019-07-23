(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.weatherBundle = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){
let weatherApp;
let settings = {
    "units": "metric",
};
const utils = require('./util.js');
const autocomplete = require('./autocomplete.js');
const constants = require('./constants.js');
const { hsp } = require('./hsp.js');

function WeatherModel(lat, lng, weatherID, full_name) {
    this.id = weatherID;
    this.temperature = '';
    this.name = '';
    this.icon = '';
    this.weather = '';
    this.lat = lat;
    this.lng = lng;
    this.full_name = full_name;
    this.alerts = [];

    this.init = async () => {
        this.weatherJson = await this.lookup();
        this.weatherResult = await this.parseWeatherResults();
    };

    this.lookup = async () => {
        let weatherJson = await fetch(`${window.origin}/weather/${this.lat}/${this.lng}/ca`)
            .catch(() =>{
            utils.displayError({
                "message": "Sorry! Something went wrong."
            }, false);
            document.getElementById('loading').style.display = 'none';
        });

        if (weatherJson.status === 200) {
            return await weatherJson.json();
        }

        utils.displayError({
            "message": "Sorry! Something went wrong."
        }, false);
        document.getElementById('loading').style.display = 'none';
        return false;
    };

    this.parseWeatherResults = async () => {
        this.temperature = Math.round(this.weatherJson['currently']['temperature']);
        this.weather = this.weatherJson['currently']['summary'];
        this.icon = `https://darksky.net/images/weather-icons/${this.weatherJson['currently']['icon']}.png`;
        if(this.weatherJson['alerts']) this.alerts = this.weatherJson['alerts'];
    };
}


function WeatherView(weatherModel) {
    this.weather = weatherModel;

    this.render = () => {
        let weatherDiv = document.getElementById('weather');

        weatherDiv.insertAdjacentHTML('afterbegin',
            `<div class="hs_message" id="${this.weather.id}">
                  <div class="hs_avatar">
                    <img src="${this.weather.icon}" class="hs_avatarImage" alt="Avatar">
                  </div>

                  <div class="hs_content">
                    <a onclick="hsp.showCustomPopup('https://hs-weather-app.herokuapp.com/weather-widget/${this.weather.lat}/${this.weather.lng}',
                    'Weather for ${this.weather.full_name}');" class="hs_userName" target="_blank">${this.weather.full_name}</a>

                    <div class="hs_contentText">
                      <p>
                        <span class="hs_postBody">${this.weather.temperature} Degrees | ${this.weather.weather}</span>
                        <span class="remove_location close icon-app-dir x-clear"
                                onclick="weatherApp.removeLocation(${this.weather.id});"></span>
                      </p>
                    </div>
                  </div>
                </div>`);

        if(this.weather['alerts'].length > 0) {
            document.getElementById(this.weather.id).insertAdjacentHTML('beforeend',
                `<div class="alert alert-info fade show" role="alert">
                            <p id="alert-title">${this.weather['alerts'][0]['title']}</p>
                           <a id="alert-url" href="${this.weather['alerts'][0]['uri']}" target="_blank">Read More</a>
                       </div>
            `)
        }
    };
}


function WeatherController() {
    this.weatherModels = [];

    this.getLocations = async () => {
        return new Promise((resolve) => {
            hsp.getData((data) => {
                if(data) {
                    resolve(data);
                } else {
                    resolve([]);
                }
            });
        }).catch((err) => console.log(err));
    };

    this.displayLoading = (display) => {
        if(display) {
            document.getElementById('weather').style.display = 'none';
            document.getElementById('loading').style.display = 'block';
        } else {
            document.getElementById('weather').style.display = 'block';
            document.getElementById('loading').style.display = 'none';
        }

    };

    this.refresh = async () => {
        this.locations = await this.getLocations();
        this.weatherModels = [];

        if(this.locations.length > 0) {
            document.getElementById('no-locations').style.display = 'none';
        }
       this.displayLoading(true);

        if (this.locations.length) {
            utils.clearDivContents('weather');

            for (let i = 0; i < this.locations.length; i++) {
                if (this.locations[i]) {
                    let lat = this.locations[i].lat;
                    let lng = this.locations[i].lng;
                    let full_name = this.locations[i].full_name;

                    let model = new WeatherModel(lat, lng, i, full_name);
                    await model.init();

                    new WeatherView(model).render();
                    this.weatherModels.push(model);
                }
            }
            this.updateLastUpdated();
        }

        this.displayLoading(false);
    };

    this.updateLastUpdated = () => {
        document.getElementById('last_updated').innerHTML = `Last updated: ${new Date()}`;
    };

    this.getLocationToAdd = async () => {
        let address = await autocomplete.getAutocompleteAddress();
        let lookupGeometry = await autocomplete.getLatLng(address);
        // TODO: rename
        let res = await utils.checkIfLocationValid({
            "lat": lookupGeometry.lat,
            "lng": lookupGeometry.lng,
        });

        if(res) {
            return {
                "geometry": lookupGeometry,
                "address": address,
            };
        }
        return false;
    };

    this.addLocation = async () => {
        let lookupGeometry = await this.getLocationToAdd();

        if (!lookupGeometry) {
            utils.displayError({
                "message": "Location not found, please try again.",
            });
            return;
        }

        let locations = await this.getLocations();
        if (!locations) {
            locations = [];
        }

        // TODO: extract into a constant
        if (locations.length >= 10) {
            utils.displayError({
                "message": "Sorry, you can't have more than 10 locations!"
            }, true);
            return;
        }
        for(let i = 0; i < locations.length; i++) {
            let latInt = parseFloat(locations[i].lat);
            let lngInt = parseFloat(locations[i].lng);
            if (latInt === lookupGeometry.geometry.lat && lngInt === lookupGeometry.geometry.lng) {
                utils.displayError({
                    "message": "Location already exists"
                });
                return;
            }
        }
        locations.push({
            "full_name": lookupGeometry.address,
            "lat": lookupGeometry.geometry.lat,
            "lng": lookupGeometry.geometry.lng,
        });
        document.getElementById('autocomplete').value = '';

        if(locations.length > 0) {
            document.getElementById('no-locations').style.display = 'none';
        }

        hsp.saveData(locations, () => {
            this.refresh();
        });
        return locations;
    };

    this.removeLocation = async (index) => {
        utils.deleteDiv(index);

        let locationsList = [];

        this.weatherModels = this.weatherModels.filter((result) => {
            return !(result.id === index);
        });

        this.weatherModels.forEach((result) => {
            locationsList.push({
                "full_name": result.full_name,
                "lat": result.lat,
                "lng": result.lng,
            });
        });

        if(locationsList.length === 0) {
            document.getElementById('no-locations').style.display = 'block';
            document.getElementById('last_updated').innerHTML = 'Last updated: never';
        }

        hsp.saveData(locationsList);
    };
}

function init() {
    global.weatherApp = new WeatherController();
    global.weatherApp.refresh();
}


exports.WeatherController = WeatherController;
exports.WeatherView = WeatherView;
exports.WeatherModel = WeatherModel;
exports.init = init;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./autocomplete.js":2,"./constants.js":3,"./hsp.js":4,"./util.js":7}],2:[function(require,module,exports){
let componentForm = {
    street_number: 'short_name',
    route: 'long_name',
    locality: 'long_name',
    administrative_area_level_1: 'short_name',
    country: 'long_name',
    postal_code: 'short_name'
};


function geolocate() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            let geolocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            let circle = new google.maps.Circle(
                {center: geolocation, radius: position.coords.accuracy});
            autocomplete.setBounds(circle.getBounds());
        });
    }
}


function getLatLng(address) {
    return new Promise((resolve) => {
        let geocode = new google.maps.Geocoder();
        geocode.geocode({
                "address": address,
            }, (geocodeResult) => {
                resolve({
                    "lat": geocodeResult[0].geometry.location.lat(),
                    "lng": geocodeResult[0].geometry.location.lng(),
                });
            }
        )
    });
}


function getAutocompleteAddress() {
    return new Promise((resolve) => {
        let place = autocomplete.getPlace();
        let address = "";

        if(place.address_components) {
            for (let i = 0; i < place.address_components.length; i++) {
                let addressType = place.address_components[i].types[0];
                if (componentForm[addressType]) {
                    let val = place.address_components[i][componentForm[addressType]];
                    address += val + ", ";
                }
            }
            resolve(address);
        } else {
            displayError({
                "message": "Sorry, that location could not be found. Please select a location from the suggestions.",
            })
        }
    });
}

exports.getAutocompleteAddress = getAutocompleteAddress;
exports.getLatLng = getLatLng;
exports.geolocate = geolocate;

},{}],3:[function(require,module,exports){
const icons = {

};

const urls = {
    "weather_base_url": "",
    "more_info_url": "",
};

},{}],4:[function(require,module,exports){
//This SDK file is compatible with SDK 0.5, SDK 0.6 and SDK 2.0

/*
 ========================SDK 4.0========================
 */
var hsp = {
    hsDashboardURL : 'https://hootsuite.com',
    version: '4.0',
    facadeVersion: '4.0',
    callbackId: 0,
    initAction : function (params) {
        this.hsDashboardURL = params.url || this.hsDashboardURL;
        this.callback = params.callback ? params.callback : function () {};
        if (params.useTheme && params.useTheme !== 'false' && params.useTheme !== '0') {
            this.applyTheme(params);
        }
        window.addEventListener("message", function (event) {
            if (event.origin == this.hsDashboardURL) {
                var payload = event.data;
                try {
                    // In SDK versions < 3, the event data is passed as a string instead of a JSON object
                    payload = typeof payload === 'object' ? payload : JSON.parse(payload);
                }
                catch (e) {
                    // Log any unexpected errors parsing the payload
                    console.log(e);
                }
                var fn = this['bind_' + payload.event];
                if (typeof fn === 'function') {
                    fn.apply(null, payload.params);
                }
                var callbackFn = this['callback_' + payload.callbackId];
                if (typeof callbackFn === 'function') {
                    callbackFn.apply(null, payload.params);
                }
            }
        }.bind(this), false);
        this.trigger('init', params);
    },
    trigger : function (action, params) {
        var sdk = this;
        if (action === 'bind') {
            sdk['bind_' + params.event] = params.callback;
            delete params.callback;
        }
        if (typeof params === 'object') {
            if (typeof params.callback === 'function') {
                sdk['callback_' + this.callbackId] = params.callback;
                delete params.callback;
                params.callbackId = this.callbackId;
                this.callbackId++;
            }

            if (typeof params.callBack === 'function') {
                sdk['callback_' + this.callbackId] = params.callBack;
                delete params.callBack;
                params.callbackId = this.callbackId;
                this.callbackId++;
            }
        }
        window.parent.postMessage({
            action: action,
            params: params,
            windowName: window.name,
            sdkVersion: sdk.version,
            facadeVersion: sdk.facadeVersion
        }, sdk.hsDashboardURL);
    },
    applyTheme : function (params) {
        // prepare theme loaded check
        var timeout = null;
        var div = null;
        var maxTries = 10;
        var counter = 0;
        var fnOnThemeLoad = params.onThemeLoad ? params.onThemeLoad : function () {
        };
        var fnGetStyle = function (el, styleProp) {
            // code from a 4 year old Quirksmode article: http://www.quirksmode.org/dom/getstyles.html
            var x = document.getElementById(el);
            var y;

            if (x.currentStyle) {
                y = x.currentStyle[styleProp];
            } else if (window.getComputedStyle) {
                y = document.defaultView.getComputedStyle(x, null).getPropertyValue(styleProp);
            }

            return y;
        };

        var fnDone = function () {
            fnOnThemeLoad();
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            if (div) {
                document.body.removeChild(div);
                div = null;
            }
        };
        var fnCheck = function () {
            counter++;
            if (fnGetStyle(elId, 'position') == 'fixed' || counter >= maxTries) {
                fnDone();
            } else {
                timeout = setTimeout(fnCheck, 100);
            }
        };

        // create theme css
        var style = document.createElement('link');
        style.type = 'text/css';
        style.rel = 'stylesheet';
        style.href = 'https://d2l6uygi1pgnys.cloudfront.net/jsapi/4-0/assets/css/ad_default.css';
        style.onload = function () {        // only IE supports this, which is good cause checking style doesn't work
            fnDone();
        };
        var domHead = document.getElementsByTagName('head');
        if (domHead.length) {
            domHead[0].appendChild(style);
        }

        // handle theme loaded check
        if (params.onThemeLoad) {
            // check for theme loaded, works in all but IE
            // looking for: div#hsLoadCheck { position: fixed; }
            var elId = 'hsLoadCheck';

            div = document.createElement('div');
            div.id = elId;
            div.style.cssText = 'display:none;';
            document.body.appendChild(div);

            // check to see when we can call our callback
            timeout = setTimeout(fnCheck, 100);
        }
    }
};

/*
 =====The Facade layer that converts SDK 0.5/0.6/2.0/3.0  function calls to SDK 4.0 function calls=======
 */

/**
 * Initializes the connection between the app and the Hootsuite dashboard and loads any theme CSS files.
 * @global
 * @param {Object} data - Input parameters.
 * @param {boolean} data.useTheme - A flag to determine whether to use the default Hootsuite theme for the app.
 * @param {array} data.sendToAppDisableList - Hides the stream menu item reading "Send to {app name}" from specific streams types. Valid values: 'facebook', 'twitter', 'instagram' and 'youtube'.
 * @param {array} data.sendProfileToAppDisableList - Deprecated. Hides the profile menu item reading "Send to {app name}" from specific streams types. Valid values: 'facebook' and 'twitter'.
 * @param {initCallback} param.callback - Callback handler for init(...)
 * @example
hsp.init({
    useTheme: true,
    sendToAppDisableList: ['facebook', 'instagram'],
    sendProfileToAppDisableList: ['twitter'],
    callback: function (data) {
        //callback handler
        console.log(data); //"No Error"     // @bypasshook
    }
});
 */
hsp.init = function (params) {
    hsp.initAction(params);
};
/**
 * Callback handler function for hsp.init(...).
 * @callback initCallback
 * @param {string} data - If the init is successful, the result string is "No Error".
 */


/**
 * Binds an event to a callback function.
 * @global
 * @example
hsp.bind(
    'sendtoapp',
    function (data) {
        //callback handler
    }
);
 * @param {string} eventName - The event name. Valid events names: "sendtoapp", "refresh", "sendassignmentupdates", "savemessagetoapp".
 * @param {(sendtoapp|refresh|sendassignmentupdates|savemessagetoapp)} callback - Function to handle the callback. The function's parameters are determined by the event type, see each event type for the corresponding data format.
 */
hsp.bind = function (eventName, callback) {
    hsp.trigger('bind', {
        event: eventName,
        callback: callback
    });
};

/**
 * Event for hsp.bind('sendtoapp', callback). This event fires when users click on the menu item reading "Send to {app name}" in Twitter, Facebook, Instagram and YouTube message streams.
 * Not all Social Networks (e.g. Twitter) provide data for the fields listed below. In such cases, if needed, the data will need to be manually retrieved.
 * @callback sendtoapp
 * @event
 * @param {Object} data - The event data from the dashboard. The data includes the post and the user who created the post.
 * @param {Object} data.post - A posted message received from the dashboard.
 * @param {string} data.post.network - The social network type of the message. Valid values are: "TWITTER", "FACEBOOK", "INSTAGRAM", "YOUTUBE"
 * @param {string} data.post.id - The external post ID
 * @param {string} data.post.parentId - The external post ID of the message's parent post. This field will be null if the message is not a comment
 * @param {string} data.post.datetime - The post datetime in ISO-8601 datetime format. e.g. "2015-05-07T17:15:54.000Z"
 * @param {string} data.post.href - The external post url. This field will be null if the message does not have an associated URL (for example, Instagram comments)
 * @param {string} data.post.source - The source of the post. e.g. Hootsuite
 * @param {Object} data.post.counts - The post's engagement
 * @param {int} data.post.counts.likes - Total number of post likes
 * @param {int} data.post.counts.shares - Total number of post shares
 * @param {int} data.post.counts.replies - Total number of post replies
 * @param {Object} data.post.content - The post content object
 * @param {string} data.post.content.body - The content
 * @param {string} data.post.content.bodyhtml - The content with HTML
 * @param {Object} data.post.user - The post author.
 * @param {string} data.post.user.userid - The author's external user ID
 * @param {string} data.post.user.username - The author's external username
 * @param {array} data.post.conversation - The conversations array contains replies made to this post
 * @param {array} data.post.conversation.message - An individual message in the conversation
 * @param {string} data.post.conversation.message.id - The external message ID
 * @param {Object} data.post.conversation.message.user - The message author.
 * @param {string} data.post.conversation.message.user.id - The author's external user ID
 * @param {string} data.post.conversation.message.user.name - The author's name
 * @param {int} data.post.conversation.message.datetime - The message created time as a Unix timestamp. e.g. 1460869577
 * @param {string} data.post.conversation.message.text - The message content.
 * @param {string} data.post.conversation.message.source - The social network type of the message. Valid values are: "TWITTER", "FACEBOOK", "INSTAGRAM", "YOUTUBE"
 * @param {string} data.post.conversation.message.geo - The geolocation of the author
 * @param {array} data.post.attachments - The post attachments.
 * @param {Object} data.post.attachments.attachment - An attachment object
 * @param {string} data.post.attachments.attachment.type - The attachment type. Valid values are: "link", "video", "photoalbum" and "photo"
 * @param {string} data.post.attachments.attachment.title - The attachment title
 * @param {Object} data.post.attachments.attachment.items - The attachment items object
 * @param {string} data.post.attachments.attachment.items.target - url to the resource
 * @param {string} data.post.attachments.attachment.items.thumbnailsrc - url to the thumbnail
 *
 * @param {Object} data.profile - The user profile object
 * @param {string} data.profile.network - The social network type of the message. Valid values are: "TWITTER",  "FACEBOOK", "INSTAGRAM", "YOUTUBE"
 * @param {string} data.profile.id - Twitter: Profile ID
 *
 * @param {string} data.profile.id - Facebook: User ID
 * @param {boolean} data.profile.first_name - Facebook: User's first name
 * @param {boolean} data.profile.last_name - Facebook: User's last name
 * @param {string} data.profile.name - Facebook: User's full name
 * @param {boolean} data.profile.gender - Facebook: User's gender. e.g. "male"
 * @param {boolean} data.profile.link - Facebook: Link to user's profile on Facebook
 * @param {string} data.profile.locale - Facebook: Locale of the user. e.g. "en_US"
 * @param {string} data.profile.location - Facebook: Location of the user. e.g. "Seattle, WA"
 * @param {string} data.profile.picture - Facebook: User's profile picture
 * @param {string} data.profile.bio - Facebook: User's bio
 * @param {string} data.profile.website - Facebook: User's website url
 *
 * @param {string} data.profile.id - Instagram: User ID
 * @param {string} data.profile.username - Instagram: Username
 * @param {string} data.profile.full_name - Instagram: User's full name
 * @param {string} data.profile.profile_picture - Instagram: User's profile picture
 * @param {string} data.profile.bio - Instagram: User's bio
 * @param {string} data.profile.website - Instagram: User's website url
 *
 * @param {string} data.profile.id - YouTube: User ID
 * @param {string} data.profile.name - YouTube: User's name
 * @param {string} data.profile.first_name - YouTube: User's first name
 * @param {string} data.profile.last_name - YouTube: User's last name
 * @param {string} data.profile.avatar_url - YouTube: User's avatar url
 * @param {string} data.profile.description - YouTube: User's description
 * @example
 //TWITTER
{
  "post": {
    "network": "TWITTER",
    "id": "771716842947682305",
    "user": {
      "userid": "17093617"
    }
  },
  "profile": {
    "network": "TWITTER",
    "id": "17093617"
  }
}
* @example
//FACEBOOK POST
{
  "post": {
    "network": "FACEBOOK",
    "href": "http://www.facebook.com/177463958820/posts/10154100312988821",
    "id": "177463958820_10154100312988821",
    "parentId": null,
    "datetime": "2016-09-01T01:30:42.000Z",
    "source": "Hootsuite",
    "counts": {
      "likes": 21,
      "dislikes": 0,
      "replies": 2,
      "shares": 15,
      "views": 0
    },
    "content": {
      "body": "These social media apps are the best of the best 👍",
      "bodyhtml": "These social media apps are the best of the best 👍"
    },
    "user": {
      "userid": "177463958820",
      "username": "Hootsuite"
    },
    "attachments": [
      {
        "type": "link",
        "url": "http://www.facebook.com/l.php?u=http%3A%2F%2Fow.ly%2FCR4m303JTAU&h=UAQFEZyBy&s=1&enc=AZOLR-5WPNQ6XJo1ApvRmG508-gHAG_HYtoQwLhb-hy841IIpayS66Fv41FrUV_uESLqgMlvV7IQ3-c_7-7Fxbdi3gB_3YeJzBlosVjcG4X1YQ",
        "title": "10 Social Media Apps You Should Be Using in 2016 (But Probably Aren’t)",
        "thumbnail": "https://external.xx.fbcdn.net/safe_image.php?d=AQAwngKEdE0TsGXR&w=720&h=720&url=https%3A%2F%2Fblog.hootsuite.com%2Fwp-content%2Fuploads%2F2016%2F05%2FBest-Social-Media-Apps-1.jpg&cfs=1",
        "items": {
          "target": "http://www.facebook.com/l.php?u=http%3A%2F%2Fow.ly%2FCR4m303JTAU&h=UAQFEZyBy&s=1&enc=AZOLR-5WPNQ6XJo1ApvRmG508-gHAG_HYtoQwLhb-hy841IIpayS66Fv41FrUV_uESLqgMlvV7IQ3-c_7-7Fxbdi3gB_3YeJzBlosVjcG4X1YQ",
          "thumbnailsrc": "https://external.xx.fbcdn.net/safe_image.php?d=AQAwngKEdE0TsGXR&w=720&h=720&url=https%3A%2F%2Fblog.hootsuite.com%2Fwp-content%2Fuploads%2F2016%2F05%2FBest-Social-Media-Apps-1.jpg&cfs=1"
        }
      }
    ],
    "conversation": [
      {
        "id": "10154100312988821_10154100449008821",
        "user": {
          "id": "10104018359821569",
          "name": "Dani PonyGirl Trynoski",
          "username": null
        },
        "datetime": 1472696475,
        "source": "facebook",
        "geo": null,
        "text": "Sandra Alvarez Peter Konieczny for marketing"
      },
      {
        "id": "10154100312988821_10154100326138821",
        "user": {
          "id": "10206688446563331",
          "name": "Heather Davis",
          "username": null
        },
        "datetime": 1472694143,
        "source": "facebook",
        "geo": null,
        "text": "Dani PonyGirl Trynoski"
      }
    ]
  },
  "profile": {
    "network": "FACEBOOK",
    "id": "177463958820",
    "link": "https://www.facebook.com/hootsuite/",
    "location": {
      "city": "Vancouver",
      "country": "Canada",
      "latitude": 49.264077580414,
      "longitude": -123.1045031954,
      "state": "BC",
      "street": "East 8th Avenue",
      "zip": "V5T1R6",
      "concatedName": "Vancouver, BC, Canada"
    },
    "name": "Hootsuite",
    "picture": "https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/10448746_10152282325793821_3338783409805956929_n.jpg?oh=cdfc0f425c8afa0c6ecae8c45c024bc7&oe=5854D36C",
    "website": [
      "http://hootsuite.com"
    ]
  }
}
* @example
//FACEBOOK COMMENT
{
  "post": {
    "network": "FACEBOOK",
    "href": null,
    "id": "10154100312988821_10154100326138821",
    "parentId": "177463958820_10154100312988821",
    "datetime": "2016-09-01T01:42:23.000Z",
    "source": "",
    "counts": {
      "likes": 0,
      "dislikes": 0,
      "replies": 3,
      "shares": 0,
      "views": 0
    },
    "content": {
      "body": "Dani PonyGirl Trynoski",
      "bodyhtml": "Dani PonyGirl Trynoski"
    },
    "user": {
      "userid": "10206688446563331",
      "username": "Heather Davis"
    },
    "attachments": [],
    "conversation": [
      {
        "id": "10154100312988821_10154100470998821",
        "user": {
          "id": "10104018359821569",
          "name": "Dani PonyGirl Trynoski",
          "username": null
        },
        "datetime": 1472696881,
        "source": "facebook",
        "geo": null,
        "text": "hahaha Truth!! Plus obtain work phones that can actually use Instagram & Hootsuite apps :)"
      },
      {
        "id": "10154100312988821_10154100450453821",
        "user": {
          "id": "10206688446563331",
          "name": "Heather Davis",
          "username": null
        },
        "datetime": 1472696560,
        "source": "facebook",
        "geo": null,
        "text": "Dani PonyGirl Trynoski yes some but not all. When we are CEO/Pres. we will have time to look into further!"
      },
      {
        "id": "10154100312988821_10154100448023821",
        "user": {
          "id": "10104018359821569",
          "name": "Dani PonyGirl Trynoski",
          "username": null
        },
        "datetime": 1472696454,
        "source": "facebook",
        "geo": null,
        "text": "Some of these are really neat, but my phone won't use half of these, the OS is too old now :(  A few of the apps on this list sound similar to apps already on the market though...and will need a huge user following to make them useful for marketing."
      }
    ]
  },
  "profile": {
    "network": "FACEBOOK",
    "first_name": "Heather",
    "id": "10206688446563331",
    "last_name": "Davis",
    "link": "https://www.facebook.com/app_scoped_user_id/10206688446563331/",
    "name": "Heather Davis",
    "picture": "https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/14100254_10208897586990461_6596975871296514827_n.jpg?oh=ea8e96ff52e6aee4f7f388837b220419&oe=5856173C"
  }
}
* @example
// INSTAGRAM
{
  "post": {
    "network": "INSTAGRAM",
    "href": "https://www.instagram.com/p/BJ0rybJAZ-_/",
    "id": "1329880371097083839_2182934",
    "parentId": null,
    "datetime": "2016-09-01T18:21:55.000Z",
    "source": "",
    "counts": {
      "likes": 231,
      "dislikes": 0,
      "replies": 6,
      "shares": 0,
      "views": 0
    },
    "content": {
      "body": "#TBT to sunshine, kiddie pools & #hootroof ☀️ #hootsuitelife 📷: @jlovebomb",
      "bodyhtml": "#TBT to sunshine, kiddie pools & #hootroof ☀️ #hootsuitelife 📷: @jlovebomb"
    },
    "user": {
      "userid": "2182934",
      "username": "hootsuite"
    },
    "attachments": [
      {
        "type": "image",
        "url": "https://scontent.cdninstagram.com/t51.2885-15/s640x640/sh0.08/e35/14099911_1806451969591609_935516459_n.jpg?ig_cache_key=MTMyOTg4MDM3MTA5NzA4MzgzOQ%3D%3D.2",
        "thumbnail": "https://scontent.cdninstagram.com/t51.2885-15/s640x640/sh0.08/e35/14099911_1806451969591609_935516459_n.jpg?ig_cache_key=MTMyOTg4MDM3MTA5NzA4MzgzOQ%3D%3D.2",
        "title": "",
        "items": {
          "target": "https://scontent.cdninstagram.com/t51.2885-15/s640x640/sh0.08/e35/14099911_1806451969591609_935516459_n.jpg?ig_cache_key=MTMyOTg4MDM3MTA5NzA4MzgzOQ%3D%3D.2",
          "thumbnailsrc": "https://scontent.cdninstagram.com/t51.2885-15/s640x640/sh0.08/e35/14099911_1806451969591609_935516459_n.jpg?ig_cache_key=MTMyOTg4MDM3MTA5NzA4MzgzOQ%3D%3D.2"
        },
        "indices": null
      }
    ],
    "conversation": []
  },
  "profile": {
    "network": "INSTAGRAM",
    "id": "2182934",
    "username": "http://ow.ly/YeRp302oVTW",
    "full_name": "Hootsuite",
    "profile_picture": "https://scontent.cdninstagram.com/t51.2885-19/11375961_427979087373427_1871744831_a.jpg",
    "bio": "A look inside Hootsuite—the world's most widely used platform for managing social media. #hootsuitelife",
    "website": "http://ow.ly/YeRp302oVTW"
  }
}
* @example
//INSTAGRAM COMMENT
{
  "post": {
    "network": "INSTAGRAM",
    "href": null,
    "id": "17842003228147208",
    "parentId": "1329880371097083839_2182934",
    "datetime": "2016-09-01T18:38:12.000Z",
    "source": "",
    "counts": {
      "likes": 0,
      "dislikes": 0,
      "replies": 0,
      "shares": 0,
      "views": 0
    },
    "content": {
      "body": "Apparently I hate kiddy pools and sunshine. #ItsFineImFine",
      "bodyhtml": "Apparently I hate kiddy pools and sunshine. #ItsFineImFine"
    },
    "user": {
      "userid": "289288021",
      "username": "kallistac"
    },
    "attachments": [],
    "conversation": []
  }
}
* @example
//YOUTUBE
{
  "post": {
    "network": "YOUTUBE",
    "href": "https://youtu.be/52KPW-Oxdp0",
    "id": "52KPW-Oxdp0",
    "parentId": null,
    "datetime": "2016-08-30T19:10:00.000Z",
    "source": "",
    "counts": {
      "likes": 0,
      "dislikes": 0,
      "replies": 0,
      "shares": 0,
      "views": 52
    },
    "content": {
      "body": "To learn more about Hootsuite & social media, visit our main channel http://youtube.com/hootsuite",
      "bodyhtml": "To learn more about Hootsuite & social media, visit our main channel http://youtube.com/hootsuite"
    },
    "user": {
      "userid": "UCadkzFvpo9WwH20bF5oSR4g",
      "username": "Hootsuite University"
    },
    "attachments": [
      {
        "type": "video",
        "url": "//www.youtube.com/embed/52KPW-Oxdp0",
        "thumbnail": "https://i.ytimg.com/vi/52KPW-Oxdp0/sddefault.jpg",
        "title": "",
        "items": {
          "target": "//www.youtube.com/embed/52KPW-Oxdp0",
          "thumbnailsrc": "https://i.ytimg.com/vi/52KPW-Oxdp0/sddefault.jpg"
        },
        "indices": null
      },
      {
        "type": "link",
        "url": "http://youtube.com/hootsuite",
        "title": null,
        "thumbnail": "",
        "items": {
          "target": "http://youtube.com/hootsuite",
          "thumbnailsrc": ""
        }
      }
    ],
    "conversation": []
  },
  "profile": {
    "network": "YOUTUBE",
    "id": "UCadkzFvpo9WwH20bF5oSR4g",
    "name": "Hootsuite University",
    "first_name": null,
    "last_name": null,
    "avatar_url": "https://yt3.ggpht.com/-3bZs2qxbMm0/AAAAAAAAAAI/AAAAAAAAAAA/h2VT7HhsTTE/s88-c-k-no-mo-rj-c0xffffff/photo.jpg",
    "description": "Hootsuite University is an online certification program that delivers best in class education about Social Media and Hootsuite. http://learn.hootsuite.com/\n\nStudents enjoy access to video-based learning modules about Hootsuite and Social Media, along with an extensive Lecture Series library from top educators, a social media jobs board and a weekly #HSUchat.\n\nAfter becoming Hootsuite Certified, students are listed in the HootSuite Social Media Consultant Directory. For more information on Hootsuite University: http://www.slideshare.net/hootsuite/hootsuite-university-social-media-overview"
  }
}
* @example
//YOUTUBE COMMENT
{
  "post": {
    "network": "YOUTUBE",
    "href": "https://youtu.be/eqcDfJ1a1gM",
    "id": "z13sjdzg3myyezyai04chfczgpmbg3nyd0k",
    "parentId": "52KPW-Oxdp0",
    "datetime": "2016-09-02T16:49:41.000Z",
    "source": "",
    "counts": {
      "likes": 0,
      "dislikes": 0,
      "replies": 0,
      "shares": 0,
      "views": 0
    },
    "user": {
      "userid": "UCVfYrVZWj7lnzYScjroJKzw",
      "username": "Sergio Fuentealba"
    },
    "content": {
      "body": "No es posible usar Linden desde el Hootsuite desde el iPhone?",
      "bodyhtml": "No es posible usar Linden desde el Hootsuite desde el iPhone?"
    },
    "attachments": [],
    "conversation": []
  },
  "profile": {
    "network": "YOUTUBE",
    "id": "UCVfYrVZWj7lnzYScjroJKzw",
    "name": "Sergio Fuentealba",
    "first_name": null,
    "last_name": null,
    "avatar_url": "https://yt3.ggpht.com/-wK0-y5KrS7k/AAAAAAAAAAI/AAAAAAAAAAA/McvjTX_pvyo/s88-c-k-no-mo-rj-c0xffffff/photo.jpg",
    "description": ""
  }
}
 */


/**
 * Event for hsp.bind('refresh', callback). This event fires when a user clicks the refresh icon within a stream app or as part of a page refresh.
 * @callback refresh
 * @event
 * @param {Object} data - The event data from the dashboard.
 * @example
{}
 */


/**
 * Event for hsp.bind('sendassignmentupdates', callback). This event fires when an assignment created by your app is updated in Hootsuite.
 * @callback sendassignmentupdates
 * @event
 * @param {Object} data - The event data from the dashboard.
 * @param {string} data.status The assignment status. Valid values: "OPEN", "RESOLVED".
 * @param {string} data.assignmentId - The Hootsuite Assignment ID.
 * @param {string} data.messageId - The app defined message identifier that is used to correlate assignment updates.
 * @param {string} data.socialNetworkMessageId - External message ID used by the social network for this message. Used when an item is a message from a Hootsuite natively supported network.
 * @param {string} data.socialNetworkType - The social network type of the message. Valid values are: "TWITTER", "FACEBOOK", "INSTAGRAM", "YOUTUBE". Used when an item is a message is from a Hootsuite natively supported network.
 * @param {string} data.messageType - The type of message. Valid values are: "STATUS_UPDATE" for Twitter, "POST" and "COMMENT" for Facebook, "POST" for Instagram. Used when an item is a message is from a Hootsuite natively supported network.
 * @param {string} data.toName - The name of the Hootsuite user or team the assignment is assigned to.
 * @param {string} data.createdDate - The date the assignment was created. e.g "yyyy-mm-dd hh:mm:ss" in UTC.
 * @param {string} data.modifiedDate - The date the assignment was modified. e.g "yyyy-mm-dd hh:mm:ss" in UTC.
 * @example
    {
    "status": "RESOLVED",
    "assignmentId": "463264434",
    "messageId": "42",
    "socialNetworkMessageId": "770648855507599360",
    "socialNetworkMessageType": "TWITTER",
    "messageType": "STATUS_UPDATE",
    "toName": "Joe Ying",
    "createdDate": "2016-03-03 11:57:33",
    "modifiedDate": "2016-03-04 10:54:32"
}
 */


/**
 * Event for hsp.bind('savemessagetoapp', callback). This event fires when a user clicks a menu item reading "Send to {app name}" in the save menu of the compose message box.
 * @callback savemessagetoapp
 * @event
 * @param {Object} data - The event data from the dashboard.
 * @param {string} data.message - The message object
 * @param {Array} data.messageTags - The message tags
 * @param {Object} data.messageTags.tag - A message tag object
 * @param {int} data.messageTags.tag.id - The message tag ID
 * @param {string} data.messageTags.tag.name - The message tag name
 * @param {Array} data.attachments - The message attachments.
 * @param {Object} data.attachments.attachment - An attachment object
 * @param {string} data.attachments.attachment.mimeType - The MIME type of the attachment
 * @param {string} data.attachments.attachment.url - The URL of the attachment
 * @param {string} data.attachments.attachment.thumbnailUrl - The thumbnail URL of the attachment
 * @param {Object} data.schedule - The schedule object
 * @param {boolean} data.schedule.isAutoScheduled - A flag to determine whether to auto schedule the message
 * @param {boolean} data.schedule.isSendAlert - A flag to determine whether email alerts are sent when the message is sent
 * @param {string} data.schedule.sendDate - The scheduled send time. E.g. "2016-05-07 15:15:00"
 * @param {float} data.schedule.timezone - The scheduled sent time timezone. E.g. -7 or 5.75
 * @param {string} data.schedule.timezoneName - The timezone name. E.g. "America/Vancouver"
 * @param {Object} data.geoLocation - The geo location object
 * @param {string} data.geoLocation.lat - The location latitude. e.g. "49.2639773"
 * @param {string} data.geoLocation.long - The location longitude. e.g. "-123.10467140000002"
 * @param {string} data.facebookTargeting - The Facebook targeting options applied
 * @param {string} data.linkedinTargeting - The Linkedin targeting options applied
 * @param {string} data.privacyOption - The privacy options applied. E.g. "{"FACEBOOK":[{"type":"EVERYONE","id":"EVERYONE","name":"Public","global":1}]}"
 * @param {Array}  data.selectedSocialNetworks - The selected social networks object
 * @param {Object} data.selectedSocialNetworks.socialNetwork - A social network object
 * @param {string} data.selectedSocialNetworks.socialNetwork.type - The social network type. Valid values are: "TWITTER", "FACEBOOK", "INSTAGRAM", "YOUTUBE"
 * @param {string} data.selectedSocialNetworks.socialNetwork.userId - The user id of the social network
 * @param {string} data.selectedSocialNetworks.socialNetwork.username - The username of the social network
 * @example
    {
    "message": "A message to send http://ow.ly/OjRL303QGnl",
    "messageBySocialNetworkType": {
        "twitter": "A message to send http://ow.ly/OjRL303QGnl",
        "facebook": "A message to send http://ow.ly/OjRL303QGnl",
        "instagram": "A message to send http://ow.ly/OjRL303QGnl"
    },
    "attachments": [{
        "url": "https://d2jhuj1whasmze.cloudfront.net/photos/original/mGHvD.jpeg",
        "thumbnailUrl": "https://d2jhuj1whasmze.cloudfront.net/photos/thumb/mGHvD.jpg",
        "mimeType": "image/jpeg"
    }],
    "schedule": {
        "isAutoScheduled": true,
        "sendDate": "2017-09-02 12:25:00",
        "isSendAlert": true,
        "timezone": -7,
        "timezoneName": "America/Vancouver"
    },
    "messageTags": [{
        "id": 100168,
        "name": "campaign_code"
    }],
    "geoLocation": {
        "lat": "49.2639631",
        "long": "-123.10462679999998"
    },
    "privacyOptions": "",
    "selectedSocialNetworks": [{
        "type": "TWITTER",
        "userId": "3307435869"
    }]
}
 */

/**
 * Event for hsp.bind('request', callback). This event fires when another app sends an event to your app.
 * @callback request
 * @event
 * @param {Object} data - The event data from another app.
 * @param {Object} data.request
 * @param {string} data.request.componentId - The target app component ID
 * @param {string} data.request.messageType - The message type as defined by your destination app component
 * @param {Object} data.request.payload - The message payload schema is defined by your destination app component
 * @param {Object} data.sender
 * @param {string} data.sender.componentId - The app component ID of the sender
 * @example
{
    "request": {
        "componentId": "1101",
        "messageType": "com.superapp.tweet",
        "payload": {
            "handle": "joeying",
            "content": "Example text content"
        }
    },
    "sender": {
        "componentId": "3433"
    }
}
 */


/**
 * Retrieve the authenticated user's Team information. Use in conjunction with the other assignments methods and callbacks (assignItem, resolveItem, Assignment Event Request). Users must assign messages to a Team or Team Member. getMemberInfo will return the users Teams and Team Members in order to create the assignment.
 We recommend calling this method after [hsp.init]{@link #init}.

 * @global
 * @param {getMemberInfoCallback} callback - Callback handler for getMemberInfo(...)
 * @example
hsp.getMemberInfo(function(data){
    //callback handler
    console.log(data.userId);  //5339913            // @bypasshook
    console.log(data.teamIds); //[151906,154887]    // @bypasshook
});
 */
hsp.getMemberInfo = function (callback) {
    hsp.trigger('get_member_info', {
        callback: callback
    });
};

/**
 * Callback handler for hsp.getMemberInfo(...)
 * @callback getMemberInfoCallback
 * @param {Object} data - The callback data.
 * @param {int} data.userId - The authenticated user's Hootsuite member ID.
 * @param {array} data.teamIds - A list of the authenticated user's Hootsuite team IDs.
 */


/**
 * Save data for an end user's instance of an app. The hsp.saveData(...) and hsp.getData(...) are designed to be used in conjunction to retain user settings from one session to another (e.g. user tokens, unique settings, and filters set by the user in the app). The methods are invoked on a per app component basis using the pid. The data can be saved in any string format.
 * @global
 * @param {Object} data - Data to be saved
 * @param {saveDataCallback} callback - Callback  handler for saveData(...)
 * @example
hsp.saveData({
    username: "Joe Ying",
    email: "joe.ying@hootsuite.com"
}, function (data) {
    //callback handler
})
 */
hsp.saveData = function (data, callback) {
    hsp.trigger('save_data', {
        data: data,
        callback: callback
    });
};

/**
 * Callback handler for hsp.saveData(...)
 * @callback saveDataCallback
 * @param {Object} data - Data saved using hsp.saveData()
 */


/**
 * Retrieve data saved for an end user's instance of an app. The hsp.saveData(...) and hsp.getData(...) are designed to be used in conjunction to retain user settings from one session to another (e.g. user tokens, unique settings, and filters set by the user in the app). The methods are invoked on a per app component basis using the pid. The data can be saved in any string format.
 * @global
 * @param {getDataCallback} callback - Callback handler for getData(...)
 * @example
hsp.getData(function(data){
    //callback handler
    console.log(data);      // @bypasshook
});
 */
hsp.getData = function (callback) {
    hsp.trigger('get_data', {
        callback: callback
    });
};

/**
 * Callback handler for hsp.getData(...)
 * @callback getDataCallback
 * @param {Object} data - Data saved using hsp.saveData()
 */


/**
 * Clears currently visible status message on the user's dashboard.
 * @global
 * @example
hsp.clearStatusMessage();
 */
hsp.clearStatusMessage = function () {
    hsp.trigger('clear_status_msg');
};

/**
 * Creates a message in the compose message box. If your post contains an image or file, use [hsp.attachFileToMessage]{@link #attachFileToMessage} in conjunction.
 * @global
 * @param {string} message - The message text.
 * @param {Object} params - The message parameters.
 * @param {int|boolean} params.scheduleTimestamp - A flag to schedule the message. The schedule time can be passed as Unix time. If true is passed in, then the scheduler will open with no default time. Defaults to false.
 * @param {string} params.twitterReplyToId - The Twitter Post ID of the Twitter message being replied to. The message text should include the original author's Twitter handle. See example below.
 * @param {boolean} params.shortenLinks - A flag to shorten all links in the message text using Ow.ly.
 * @example
hsp.composeMessage(
    "The world's most widely used social relationship platform: https://hootsuite.com @JoeYing_1986",
    {
        shortenLinks: true,
        timestamp: 1460520580,
        twitterReplyToId: '627186559909900288'
    }
);
 */
hsp.composeMessage = function (message, params) {
    hsp.trigger(
        'send_text',
        {
            text: message,
            params: params
        });
};


/**
 * Open a retweet dialog process in the Hootsuite dashboard.
 * @global
 * @param {string} id - Twitter message ID to retweet.
 * @param {string} [screenName] - Twitter handle to retweet with.
 * @example
hsp.retweet(
    "369937169529708544",
    "Hootsuite"
);
 */
hsp.retweet = function (id, screenName) {
    hsp.trigger('twitter_retweet', {
        data: {
            id: id,
            screen_name: screenName
        }
    });
};


/**
 * Attach a file to the compose message box. Both images and files can be attached to a message. Images will be added as attachments whereas files upload to Ow.ly and a shortened link that redirects to the file is added to the message text.
 * @global
 * @param {Object} data - Input parameters.
 * @param {string} data.url - The URL of the file to attach. Must be HTTPS.
 * @param {string} [data.name] -  The name of the file. This will be used as the filename when a file is uploaded to Ow.ly.
 * @param {string} data.extension - The file extension. Valid image extensions: jpg, jpeg, gif, png. Valid document extensions: doc, docx, pdf, xls, xlsx, ppt, pptx, odt, ods, odp, txt, rtf, csv, psd, psb, ai, eps, fla, mp3
 * @param {int} data.timestamp - The current Unix time, used for authentication.
 * @param {string} data.token - SHA512(user_id + timestamp + url + secret)
 * @example
hsp.attachFileToMessage({
    url: "https://hootsuite.com/var/hootsuite/storage/images/media/images/media-kit/office-photos/hq2/53153-2-eng-US/hq2.jpg",
    name: "hq2.jpg",
    extension: "jpg",
    timestamp: 1472580556,
    token: "5df51ff8a619853d947bbdd081551736642f26bf600bac9d3a5f5d176f45f2dd572e6277614d340993fe74d88ed33b96a848238ffaa64459e386efdcec2ba7b4"
});
 */
hsp.attachFileToMessage = function (data) {
    hsp.trigger(
        'attach_file',
        {
            file: data
        }
    );
};

/**
 * Attach media uploaded using the Hootsuite REST API to the compose message box.
 * @global
 * @param {Object} data - Input parameters.
 * @param {string} data.mediaId - The Hootsuite Media ID. The Media ID is returned when media is uploaded using the Hootsuite REST API.
 * @param {string} data.timestamp - The current Unix time, used for authentication.
 * @param {string} data.token - SHA512(user_id + timestamp + mediaId + secret)
 * @example
hsp.attachMedia({
    id: "aHR0cHM6Ly9ob290c3VpdGUtdmlkZW8uczMuYW1hem9uYXdzLmNvbS9kZXYvNTMzOTk0N18zYzc1YTY1Yy1lYTEzLTQ0ZjItYWM2MS01YjljZDA0NDE1NTAubXA0",
    timestamp: 1472580556,
    token: "5df51ff8a619853d947bbdd081551736642f26bf600bac9d3a5f5d176f45f2dd572e6277614d340993fe74d88ed33b96a848238ffaa64459e386efdcec2ba7b4"
});
 */
hsp.attachMedia = function (data) {
    hsp.trigger(
        'attach_media',
        {
            media: data
        }
    );
};

/**
 * Open a user info popup window populated with custom information from the app.
 * @global
 * @param {Object} data - Input parameters.
 * @param {string} data.fullName - User's full name.
 * @param {string} data.screenName - User's Twitter handle
 * @param {string} data.avatar - User's avatar image URL. Must be HTTPS.
 * @param {string} data.profileUrl - URL to open when the user clicks the avatar image.
 * @param {string} data.userLocation - User's location.
 * @param {string} data.bio - User's bio.
 * @param {array} data.extra - Custom fields that are rendered at the bottom of the popup.
 * @param {Object} data.extra.item - A custom field.
 * @param {string} data.extra.item.label - Field label.
 * @param {string} data.extra.item.value - Field value.
 * @param {array} data.links - Custom links that are rendered at the bottom of the popup.
 * @param {Object} data.links.item - A custom link.
 * @param {string} data.links.item.label - Link Name.
 * @param {string} data.links.item.url - Link URL.
 * @example
 hsp.customUserInfo({
    fullName: "David Chan",
    screenName: "@chandavid",
    avatar: "https://placehold.it/30x30/444",
    profileURL: "https://twitter.com/chandavid",
    userLocation: "Vancouver, BC",
    bio: "JavaScript/web/martini developer. Working on @Hootsuite. Making by breaking.",
    extra: [
        {
            label: "Age",
            value: "Unknown"
        },
        {
            label: "Gender",
            value: "Male"
        }
    ],
    links: [
        {
            label: "Hootsuite",
            url: "https://hootsuite.com"
        },
        {
            label: "Blog",
            url: "https://blog.hootsuite.com"
        }
    ]
 });
 */
hsp.customUserInfo = function (data) {
    hsp.trigger('custom_user_info', {
        data: data
    });
};

/**
 * Open a modal popup window containing an IFrame. Please note:
 *
 * 1) Event binding functions are not available in the custom popup.
 *
 * 2) Your IFrame page in the modal popup window and the app page should share the same domain.
 *
 * 3) You should not call hsp.init() again in the modal IFrame page. If required, you can use JavaScript to communicate between the popup and an app like this: ```window.parent.frames["<%= sdkApiKey %>_<%= pid %>"].location.reload();```
 * @global
 * @param {Object} data - Input parameters.
 * @param {string} data.url - IFrame URL. Must be HTTPS.
 * @param {string} data.title - Title of the popup modal box
 * @param {int} [data.w] - The width of the popup. Range: 300px to 900px. Default: 640px
 * @param {int} [data.h] - The height of the popup. Range: 225px to 500px. Default: 445px
 * @example
hsp.showCustomPopup(
    {
        url: "https://sampleapp.com/iframes/popup",
        title: "Sample App Popup",
        w: 800,
        h: 400
    }
);
 */
hsp.showCustomPopup = function (params, title, width, height) {
    var paramsObj = {};
    if (typeof params === 'object') {
        paramsObj = params;
    } else {
        paramsObj = {
            url: params,
            title: title,
            w: width,
            h: height
        };
    }
    hsp.trigger('custom_popup_open', paramsObj);
};

/**
 * Close a modal popup window. This function is called from the popup IFrame itself. Please note:
 *
 * 1) Event binding functions are not available in the custom popup.
 *
 * 2) Your IFrame page in the modal popup window and the app page should share the same domain.
 *
 * 3) You should not call hsp.init() again in the modal IFrame page. If required, you can use JavaScript to communicate between the popup and an app like this: ```window.parent.frames["<%= sdkApiKey %>_<%= pid %>"].location.reload();```
 * @global
 * @param {string} sdkApiKey - The app's SDK API key which can be retrieved from the Developer Portal.
 * @param {string} pid - The pid is associated with each unique user installation of an app (or plugin). You can get the pid of each app stream from the url request your server gets. For example: https://demo.ca/stream.html?lang=en&theme=blue_steel&timezone=-25200&pid=60956&uid=136
 * @example
hsp.closeCustomPopup(3x6zyxglj36s4ockg8c8s0k4o3ibhago7n4','82802');
 */
hsp.closeCustomPopup = function (data) {
    hsp.trigger('custom_popup_close', data);
};


/**
 * Open a modal popup window containing an image preview. ** Use in Stream components only. **
 * @global
 * @param {string} src - URL of the image. Must be HTTPS.
 * @param {string} [externalUrl] - The URL to open when the user clicks the image.
 * @example
hsp.showImagePreview(
    "https://hootsuite.com/var/hootsuite/storage/images/media/images/media-kit/office-photos/hq2/53153-2-eng-US/hq2.jpg",
    "https://hootsuite.com"
);
 */
hsp.showImagePreview = function (src, externalUrl) {
    hsp.trigger('show_image_preview', {
        data: {
            src: src,
            external_url: externalUrl
        }
    });
};


/**
 * Open a lightbox popup containing an image preview. ** Use in Content Source components only. **
 * @global
 * @param {string} src - URL of the image. Must be HTTPS.
 * @example
hsp.showLightbox(
    "https://hootsuite.com/var/hootsuite/storage/images/media/images/media-kit/office-photos/hq2/53153-2-eng-US/hq2.jpg"
);
 */
hsp.showLightbox = function (src) {
    hsp.trigger('show_lightbox', {
        data: {
            src: src
        }
    });
};

/**
 * Display a status message in the top center of the dashboard. The message is automatically cleared after 3 seconds.
 * @global
 * @param {string} message - The message to display. This should be brief, max. 70 characters.
 * @param {type} type - The type of notification to display. Valid values: info (blue background), error (red background), warning (yellow background), success (green background)
 * @example
hsp.showStatusMessage(
    "Nice work!",
    "success"
);
 */
hsp.showStatusMessage = function (message, type) {
    hsp.trigger('show_status_msg', {
        message: message,
        type: type
    });
};

/**
 * Update an app stream subtitle.
 * @global
 * @param {string} name - The subtitle of the app stream, limited to 35 characters
 * @example
hsp.updatePlacementSubtitle("Sample App Stream");
 */
hsp.updatePlacementSubtitle = function (name) {
    hsp.trigger('update_placement_subtitle', {
        data: {
            name: name
        }
    });
};

/**
 * Open a user info popup for the specified Twitter username.
 * @global
 * @param {string} twitterHandle - Twitter handle.
 * @example
hsp.showUser("hootsuite_help");
 */
hsp.showUser = function (twitterHandle) {
    hsp.trigger('show_user', {
        data: {
            twitter_handle: twitterHandle
        }
    });
};

/**
 * Open a follow/unfollow popup for the specified Twitter username.
 * @global
 * @param {string} twitterHandle - Twitter handle to follow/unfollow. Handles will be sanitized to remove all characters that aren't alphanumeric or underscores.
 * @param {boolean} isFollow - A flag to determine whether to follow/unfollow. Values: "true" to follow, "false" to unfollow.
 * @example
hsp.showFollowDialog("hootsuite_help", true);
 */
hsp.showFollowDialog = function (twitterHandle, isFollow) {
    hsp.trigger('show_follow_dialog', {
        data: {
            twitter_handle: twitterHandle,
            is_follow: isFollow
        }
    });
};

/**
 * Retrieve a list of all Twitter account IDs the authenticated user has access to in their Hootsuite account.
 * @global
 * @param {getTwitterAccountsCallback} callback - Callback handler for getTwitterAccounts(...)
 * @example
hsp.getTwitterAccounts(function(data){
    //callback handler
    console.log(data[0]); //3307435869     // @bypasshook
});
 */
hsp.getTwitterAccounts = function (callback) {
    hsp.trigger('get_twitter_accounts', {
        callback: callback
    });
};

/**
 * Callback handler for getTwitterAccounts(...)
 * @callback getTwitterAccountsCallback
 * @param {array} data - A list of Twitter account IDs the authenticated user has added to their Hootsuite account.
 * @param {string} data.twitterId - An individual Twitter account Id in the array.
 */


/**
 * Assign an item from an app to the Hootsuite Assignments Manager. When an assignment changes in Hootsuite the app can receive updates by setting the Assignments Callback URL in the Developer Portal. The Assignments Callback URL must be set otherwise the end user will receive an error message.
 *
 * An item can be either a message from a network supported natively in Hootsuite or a social network unsupported by Hootsuite. When an app assigns an item that is not supported natively by Hootsuite, the end user will not be able to engage with the message in the Assignments Manager and Analytics will not be calculated. When an assignment is created or updated, the app should display the appropriate CSS (refer to the template for styles).
 * @global
 * @param {Object} data - Input parameters.
 * @param {string} [data.socialNetworkMessageId] - External message ID used by the social network for this message. Used when an item is a message from a Hootsuite natively supported network.
 * @param {string} [data.socialNetworkType] - The social network type of the message. Valid values are: "TWITTER", "FACEBOOK", "INSTAGRAM". Used when an item is a message from a Hootsuite natively supported network.
 * @param {string} [data.messageType] - The type of message. Valid values are: "STATUS_UPDATE" for Twitter, "POST" and "COMMENT" for Facebook, "POST" for Instagram. Used when an item is a message from a Hootsuite natively supported network.
 * @param {string} data.messageId - The app defined message identifier that is used to correlate assignment updates.
 * @param {string} data.messageAuthor - The message author's name. Used when an item is a message from a social network that is unsupported by Hootsuite.
 * @param {string} data.messageAuthorAvatar - The author's avatar URL. Must be HTTPS. Used when an item is a message from a social network that is unsupported by Hootsuite.
 * @param {string} data.message - The message text. Used when an item is a message from a social network that is unsupported by Hootsuite.
 * @param {string} [data.timestamp] - The time the message was published to the social network as a Unix timestamp. Used when an item is a message from a social network that is unsupported by Hootsuite.
 * @example
//A message on a social network natively supported by Hootsuite
hsp.assignItem({
    socialNetworkMessageId: "770648855507599360",
    socialNetworkType: "TWITTER",
    messageType: "STATUS_UPDATE",
    messageId: "770648855507599360"
    message: "30-in-30: With few off-season changes, the @Penguins like their chances of a repeat. http://s.nhl.com/6014B4XzY"
});

//A message on a social network unsupported by Hootsuite
hsp.assignItem({
    messageId: "42",
    messageAuthor: "DeepThought85",
    messageAuthorAvatar: "https://deep.thought/avatar.jpg",
    message: "What is answer to life the universe and everything?",
    timestamp: "1462466950"
});
 */
hsp.assignItem = function (item) {
    hsp.trigger('assign_item', {
        data: item
    });
};

/**
 * Resolve an assignment made from an app within the App Stream.
 * @global
 * @param {Object} data - Input parameters.
 * @param {string} data.assignmentId - The Hootsuite Assignment ID. The Assignment ID is returned via the API Callback Webhook and the sendAssignmentUpdatesCallback event.
 * @example
hsp.resolveItem({
    assignmentId: "7775154"
});
 */
hsp.resolveItem = function (item) {
    hsp.trigger('resolve_item', {
        data: item
    });
};

/**
 * Get user authentication information.
 * @global
 * @param {getAuthCallback} callback - Callback handler for hsp.getAuth(...)
 * @example
hsp.getAuth(function(data){
    //callback handler
    console.log(data.i);        // @bypasshook
    console.log(data.ts);       // @bypasshook
    console.log(data.token);    // @bypasshook
});
 */
hsp.getAuth = function (callback) {
    hsp.trigger('get_auth', {
        callback: callback
    });
};

/**
 * Callback handler for hsp.getAuth(...)
 * @callback getAuthCallback
 * @param {Object} data The callback data.
 * @param {int} data.i - Hootsuite User ID.
 * @param {int} data.ts - Current Unix timestamp in UTC.
 * @param {string} data.token - Secret token generated from SHA512(user_id + timestamp + url + secret).
 */


/**
 * @ignore
 * [Internal use only for inter-app communication] Sends a request to another app.
 * @global
 * @param {Object} data - Input parameters.
 * @param {string} data.componentId - Target app component ID.
 * @param {string} data.messageType - Message type defined by the target app component.
 * @param {Object} data.payload - Message payload as defined by the message type.
 * @param {sendRequestCallback} data.callback - Callback handler for hsp.sendRequest(...).
 * @example
hsp.sendRequest({
    componentId: "1101",
    messageType: "com.superapp.tweet",
    payload: {
        handle: "joeying",
        content: "Example text content"
    },
    callback: function (data) {
        //callback handler
        console.log(data.message); //error message      // @bypasshook
    }
 })
*/
hsp.sendRequest = function (request) {
    hsp.trigger('send_request', request);
};

/**
 * @ignore
 * [Internal use only] Callback handler for hsp.sendRequest(...)
 * @callback sendRequestCallback
 * @param {Object} data - An error response.
 * @param {int} data.errorCode - The error code.
 * @param {string} data.message - The error message.
 */
module.exports = {
    hsp: hsp
};

},{}],5:[function(require,module,exports){
(function (global){
const utils = require('./util.js');
const autocomplete = require('./autocomplete.js');
const constants = require('./constants.js');
const menus = require('./menus.js');
const index = require('./index.js');
const app = require('./app.js');
const { hsp } = require('./hsp.js');

// TODO: setup better
global.utils = utils;
global.autocomplete = autocomplete;

module.exports = {
    WeatherModel: app.WeatherModel,
    WeatherView: app.WeatherView,
    WeatherController: app.WeatherController,
};

document.addEventListener('DOMContentLoaded',  () => {
    hsp.init({useTheme: true});
    app.init();
    menus.loadTopBars();

    hsp.bind('refresh', () => weatherApp.refresh());
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./app.js":1,"./autocomplete.js":2,"./constants.js":3,"./hsp.js":4,"./index.js":5,"./menus.js":6,"./util.js":7}],6:[function(require,module,exports){
function loadTopBars() {
    var topBarControls = document.getElementsByClassName('hs_topBarControlsBtn');

    Array.prototype.forEach.call(topBarControls, function(topBarControl) {
        topBarControl.addEventListener('click', function (event) {
            var topBarDropdowns = document.getElementsByClassName('hs_topBarDropdown');
            for (var i = 0; i < topBarDropdowns.length; i++) {
                if (event.currentTarget.getAttribute('data-dropdown') === topBarDropdowns[i].getAttribute('data-dropdown')) {
                    if (topBarDropdowns[i].style.display === 'none') {
                        topBarDropdowns[i].style.display = 'block';
                        event.currentTarget.classList.add('active');
                    } else {
                        topBarDropdowns[i].style.display = 'none';
                        event.currentTarget.classList.remove('active');
                    }
                } else {
                    // remove active on all dropdown buttons except the one that was clicked
                    var topBarBtns = document.getElementsByClassName('hs_topBarControlsBtn');
                    for (var p = 0; p < topBarBtns.length; p++) {
                        if (topBarBtns[p].getAttribute('data-dropdown') !== event.currentTarget.getAttribute('data-dropdown')) {
                            topBarBtns[p].classList.remove('active');
                        }
                    }
                    // close all dropdowns except the one that was clicked
                    topBarDropdowns[i].style.display = 'none';
                }
            }
        });
    });
}

function bindTemperatureSelect() {
    let temperatureSelect = document.getElementById('temperature_select');
}

exports.loadTopBars = loadTopBars;

},{}],7:[function(require,module,exports){
function displayError(error, timeout){
    document.getElementById('alerts').innerHTML = `
    <div class="alert alert-danger fade show" id="error-alert" role="alert">
   ${error.message}
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>`;

    if(timeout) {
        setTimeout(() => {
            document.getElementById('alerts').innerHTML = '';
        }, 3000);
    }
}


function clearDivContents(id) {
    let weatherDiv = document.getElementById(id);

    while (weatherDiv.firstChild) {
        weatherDiv.removeChild(weatherDiv.firstChild);
    }
}


function deleteDiv(id) {
    let divToDelete = document.getElementById(id);
    divToDelete.remove();
}


async function checkIfLocationValid(location){
    let weatherJson = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&appid=6cfd34fc94e03afb78bee39afd8989bb&units=ca`);
    if (weatherJson.status === 200) {
        return await weatherJson.json();
    }
    return false;
}


function removeAllLocations() {
    hsp.saveData([], () => {
        clearDivContents('weather');
    });
    document.getElementsByClassName('hs_topBarDropdown')[0].style.display = 'none';
    document.getElementById('no-locations').style.display = 'block';
    document.getElementById('last_updated').innerHTML = 'Last updated: never';
}

exports.displayError = displayError;
exports.checkIfLocationValid = checkIfLocationValid;
exports.removeAllLocations = removeAllLocations;
exports.deleteDiv = deleteDiv;
exports.clearDivContents = clearDivContents;

},{}]},{},[5])(5)
});

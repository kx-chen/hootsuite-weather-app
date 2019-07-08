'use strict';

function getSavedLocations() {
  return ['Vancouver, CA', 'Ottawa, CA'];
}

async function loadWeather() {
  var weatherJson = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Vancouver,Ca
               &appid=6cfd34fc94e03afb78bee39afd8989bb&units=metric`);
  return await weatherJson.json();
}

function parseWeatherJson(weatherJson) {
  // TODO: Improve bracket style/mapping
  return {
    "temperature": weatherJson['main']['temp'],
    "weather": weatherJson['weather'][0]['main'],
    "name": weatherJson['name'],
  };
}
// http://openweathermap.org/img/wn/10d@2x.png
// TODO: rename
function updateSingleWeatherLocation(weather, indexToUpdate) {
  var d = $('.hs_postBody').each((index, element) => {
    console.log(index, element);
    if(index === indexToUpdate) {
      element.innerHTML = `${weather['temperature']} Degrees | ${weather['weather']}`;
    }
  });
  return 'aaa';
}

function generateHTMLforLocations(locations) {

}

// for our purposes this is the same thing as jQuery's  $(document).ready(...)
document.addEventListener('DOMContentLoaded', async function () {
  hsp.init({
    useTheme: true
  });

  var weatherJson = await loadWeather();
  var weather = parseWeatherJson(weatherJson);
  updateSingleWeatherLocation(weather, 0);

  var socket = io();
  hsp.bind('refresh', function () {
    console.log('refresh.');
    socket.emit('refresh');
  });

});

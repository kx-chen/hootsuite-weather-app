'use strict';

// TODO: not hardcode
function getSavedLocations() {
  return ['Vancouver, CA', 'Ottawa, CA', 'Vernon, CA'];
}

function saveLocations() {

}

async function loadWeather(city) {
  let weatherJson = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}
               &appid=6cfd34fc94e03afb78bee39afd8989bb&units=metric`);
  return await weatherJson.json();
}

function parseWeatherJson(weatherJson) {
  return {
    "temperature": weatherJson['main']['temp'],
    "weather": weatherJson['weather'][0]['main'],
    "name": weatherJson['name'],
    "icon": weatherJson['weather'][0]['icon'],
  };
}
// TODO: rename classes
// TODO: do all in one loop
function updateSingleWeatherLocation(weather, indexToUpdate) {
  $('.hs_postBody').each((index, element) => {
    console.log(index, element);
    if(index === indexToUpdate) {
      element.innerHTML = `${weather['temperature']} Degrees | ${weather['weather']}`;
    }
  });

  $('.hs_userName').each((index, element) => {
    console.log(index, element);
    if(index === indexToUpdate) {
      element.innerHTML = `${weather['name']}`;
    }
  });

  $('.hs_avatarImage').each((index, element) => {
    console.log(index, element);
    if(index === indexToUpdate) {
      element.src = `http://openweathermap.org/img/wn/${weather['icon']}@2x.png`;
    }
  });
}

function generateBoilerplateHTML(){

}

document.addEventListener('DOMContentLoaded', async function () {
  hsp.init({
    useTheme: true
  });

  // TODO: not use forEach
  getSavedLocations().forEach(async (location, index) => {
    let weatherJson = await loadWeather(location);
    let weather = parseWeatherJson(weatherJson);
    updateSingleWeatherLocation(weather, index);
  });

  let socket = io();
  hsp.bind('refresh', function () {
    console.log('refresh.');
    socket.emit('refresh');
  });

});

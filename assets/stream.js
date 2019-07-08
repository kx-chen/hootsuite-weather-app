'use strict';

let config = {

};

async function getSavedLocations() {
  return new Promise((resolve) => {
    hsp.getData((data) => {
      resolve(data);
    });
  }).catch((err) => {
    console.log(err);
  });

}

async function addLocation() {
  let locationForm = document.getElementById('location');
  let locations = await getSavedLocations();

  if (!locations) {
    locations = [];
  }

  locations.push(locationForm.value);
  // TODO: handle errors
  hsp.saveData(locations, () => {
    console.log('location added, value:', document.getElementById('location').value);
    populateWeatherDiv();
    locationForm.value = '';
  });
}

async function removeLocation() {
  hsp.saveData([], () => {
    clearWeatherDiv();
  });
}

async function loadWeather(city) {
  // TODO: don't push api key
  let weatherJson = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}
               &appid=6cfd34fc94e03afb78bee39afd8989bb&units=metric`);
  return await weatherJson.json();
}

function parseWeatherJson(weatherJson) {
  if (weatherJson['message']) {
    return {
      "name": 'City not found',
      "temperature": 'Unknown',
      "weather": 'Unknown',
      "icon": '/assets/question.png',
    }
  }
  return {
    "temperature": weatherJson['main']['temp'] ||'',
    "weather": weatherJson['weather'][0]['main'] || 'Unknown',
    "name": weatherJson['name'] || 'Unknown Location',
    "icon": `http://openweathermap.org/img/wn/${weatherJson['weather'][0]['icon']}@2x.png`,
  };
}
// TODO: rename classes
// TODO: do all in one loop
function updateSingleWeatherLocation(weather, indexToUpdate) {
  $('.hs_postBody').each((index, element) => {
    if(index === indexToUpdate) {
      element.innerHTML = `${weather['temperature']} Degrees | ${weather['weather']}`;
    }
  });

  $('.hs_userName').each((index, element) => {
    if(index === indexToUpdate) {
      element.innerHTML = weather['name'];
    }
  });

  $('.hs_avatarImage').each((index, element) => {
    if(index === indexToUpdate) {
      element.src = weather['icon'];
    }
  });
}

function generateBoilerplateHTML(){
  let weatherDiv = document.getElementById('weather');
  weatherDiv.insertAdjacentHTML('afterbegin',
      `<div class="hs_message">
      <div class="hs_avatar">
        <img src="http://openweathermap.org/img/wn/10d@2x.png" class="hs_avatarImage" alt="Avatar">
      </div>

      <div class="hs_content">
        <p href="#" class="hs_userName"></p>
        <div class="hs_contentText">
          <p>
            <span class="hs_postBody">Loading...</span>
          </p>
        </div>
      </div>
    </div>`);

}

function clearWeatherDiv() {
  let weatherDiv = document.getElementById('weather');
  while (weatherDiv.firstChild) {
    weatherDiv.removeChild(weatherDiv.firstChild);
  }
}

async function populateWeatherDiv() {
  // TODO: not use forEach
  let locations = await getSavedLocations();

  if (locations) {
    clearWeatherDiv();
    locations.forEach(async (location, index) => {
      generateBoilerplateHTML();
      let weatherJson = await loadWeather(location);

      let weather = parseWeatherJson(weatherJson);
      updateSingleWeatherLocation(weather, index);
    });

    document.getElementById('last_updated').innerHTML = `Last updated: ${new Date()}`
  }
}


document.addEventListener('DOMContentLoaded', async function () {
  hsp.init({
    useTheme: true
  });

  populateWeatherDiv();

  let socket = io();
  hsp.bind('refresh', function () {
    populateWeatherDiv();
    console.log('refresh.');
    socket.emit('refresh');
  });

});

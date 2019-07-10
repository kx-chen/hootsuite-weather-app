let weatherResults = [];
let config = {
  "units": "C",
};

'use strict';


async function getSavedLocations() {
  return new Promise((resolve) => {
    hsp.getData((data) => {
      resolve(data);
    });
  }).catch((err) => console.log(err));

}

async function addLocation() {
  let locationForm = document.getElementById('location');
  if (!locationForm.value) return;

  let locations = await getSavedLocations();
  if (!locations) {
    locations = [];
  }
  locations.push(locationForm.value);

  hsp.saveData(locations, () => {
    populateWeatherDiv();
    locationForm.value = '';
  });
}

async function removeLocation(index) {
  deleteDiv(index);

  let locationsList = [];

  weatherResults = weatherResults.filter((result) => {
    return !(result.id === index);
  });

  weatherResults.forEach((result) => {
    locationsList.push(result.name);
  });

  hsp.saveData(locationsList);
}

async function removeAllLocations() {
  weatherResults = [];
  hsp.saveData([], () => {
    clearDivContents('weather');
  });
}

async function loadWeather(city) {
  // TODO: don't push api key
  let weatherJson = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}
               &appid=6cfd34fc94e03afb78bee39afd8989bb&units=metric`);
  return await weatherJson.json();
}

async function parseWeatherJson(weatherJson, id) {
  return new Promise((resolve) => {
    if (weatherJson['message']) {
      // return generic error text
      resolve({
        "id": id,
        "name": 'City not found',
        "temperature": 'Unknown',
        "weather": 'Unknown',
        "icon": '/assets/question.png',
      });
    }

    resolve({
      "id": id,
      "temperature": weatherJson['main']['temp'] ||'',
      "weather": weatherJson['weather'][0]['main'] || 'Unknown',
      "name": weatherJson['name'] || 'Unknown Location',
      "icon": `http://openweathermap.org/img/wn/${weatherJson['weather'][0]['icon']}@2x.png`,
    });
  });
}


function renderSingleWeatherDiv(weather, index) {
  let weatherDiv = document.getElementById('weather');
  weatherDiv.insertAdjacentHTML('afterbegin',
      `<div class="hs_message" id="${index}">
      <div class="hs_avatar">
        <img src="${weather['icon']}" class="hs_avatarImage" alt="Avatar">
      </div>

      <div class="hs_content">
        <p class="hs_userName">${weather['name']}</p>
        <div class="hs_contentText">
          <p>
            <span class="hs_postBody">${weather['temperature']} Degrees | ${weather['weather']}</span>
            <button class="remove_location" onclick="removeLocation(${index});">X</button>
          </p>
        </div>
      </div>
    </div>`);
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


async function populateWeatherDiv() {
  let locations = await getSavedLocations();

  if (locations) {
    clearDivContents('weather');
    weatherResults = [];

    for(let i = 0; i < locations.length; i++) {
      let weatherJson = await loadWeather(locations[i]);
      let weather = await parseWeatherJson(weatherJson, i);
      weatherResults.push(weather);
      renderSingleWeatherDiv(weather, i);
    }


    document.getElementById('last_updated').innerHTML = `Last updated: ${new Date()}`;
  }
}


document.addEventListener('DOMContentLoaded', async function () {
  hsp.init({useTheme: true});

  populateWeatherDiv();
  loadTopBars();
  bindApiButtons();

  hsp.bind('refresh', () => populateWeatherDiv());
});

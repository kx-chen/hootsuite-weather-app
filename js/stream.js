let weatherResults = [];
let config = {
  "units": "metric",
  "weather_base_url": "",
};

async function getSavedLocations() {
  return new Promise((resolve) => {
    hsp.getData((data) => {
      resolve(data);
    });
  }).catch((err) => console.log(err));
}

function displayError(error){
  document.getElementById('alerts').innerHTML = `
    <div class="alert alert-danger fade show" id="error-alert" role="alert">
   ${error.message}
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>`;

  setTimeout(() => {
    document.getElementById('alerts').innerHTML = '';
  }, 3000);
}

async function addLocation() {
  let locationForm = document.getElementById('autocomplete');
  let cityToLookup = locationForm.value;
  locationForm.value = '';

  let otherResult = await getLatLng(cityToLookup);

  if (!cityToLookup) return;
  let res = await checkIfLocationValid({
    "lat": otherResult.lat,
    "lng": otherResult.lng,
  });

  if (!res) {
    displayError({
      "message": "Location not found, please try again.",
    });
    return;
  }

  let locations = await getSavedLocations();
  if (!locations) {
    locations = [];
  }
  locations.push({
    "lat": otherResult.lat,
    "lng": otherResult.lng,
  });

  hsp.saveData(locations, () => {
    populateWeatherDiv();
  });
}

async function removeLocation(index) {
  deleteDiv(index);

  let locationsList = [];

  weatherResults = weatherResults.filter((result) => {
    return !(result.id === index);
  });

  weatherResults.forEach((result) => {
    locationsList.push(result);
  });

  hsp.saveData(locationsList);
}

async function removeAllLocations() {
  weatherResults = [];
  hsp.saveData([], () => {
    clearDivContents('weather');
  });
}

async function loadWeather(coords) {
  // TODO: don't push api key
  let weatherJson = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lng}&appid=6cfd34fc94e03afb78bee39afd8989bb&units=${config.units}`);
  if (weatherJson.status === 200) {
    return await weatherJson.json();
  }
  return false;
}

async function parseWeatherJson(weatherJson, id) {
  return new Promise((resolve) => {
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
            <button class="remove_location close" 
                    type="button" 
                    data-toggle="tooltip"
                    title="Remove"
                    data-dismiss="alert" 
                    aria-label="Close"
                    onclick="removeLocation(${index});">X</button>
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

async function checkIfLocationValid(location){
  return await loadWeather(location);
}


async function populateWeatherDiv() {
  let locations = await getSavedLocations();

  if (locations) {
    clearDivContents('weather');
    weatherResults = [];

    for(let i = 0; i < locations.length; i++) {
      let weatherJson = await loadWeather(locations[i]);
      if (weatherJson) {
        let weather = await parseWeatherJson(weatherJson, i);
        weather.lat = locations[i].lat;
        weather.lng = locations[i].lng;

        weatherResults.push(weather);
        renderSingleWeatherDiv(weather, i);
      }
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
  $('[data-toggle="tooltip"]').tooltip();
});

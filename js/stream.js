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
        weatherResults.push(weather);
        renderSingleWeatherDiv(weather, i);
      }
    }


    document.getElementById('last_updated').innerHTML = `Last updated: ${new Date()}`;
  }
}

var placeSearch, autocomplete;

var componentForm = {
  street_number: 'short_name',
  route: 'long_name',
  locality: 'long_name',
  administrative_area_level_1: 'short_name',
  country: 'long_name',
  postal_code: 'short_name'
};

function initAutocomplete() {
  // Create the autocomplete object, restricting the search predictions to
  // geographical location types.
  autocomplete = new google.maps.places.Autocomplete(
      document.getElementById('autocomplete'), {types: ['(cities)']});

  // Avoid paying for data that you don't need by restricting the set of
  // place fields that are returned to just the address components.
  autocomplete.setFields(['address_component']);

  // When the user selects an address from the drop-down, populate the
  // address fields in the form.
  autocomplete.addListener('place_changed', addLocation);
}

// Bias the autocomplete object to the user's geographical location,
// as supplied by the browser's 'navigator.geolocation' object.
function geolocate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var geolocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      var circle = new google.maps.Circle(
          {center: geolocation, radius: position.coords.accuracy});
      autocomplete.setBounds(circle.getBounds());
    });
  }
}

function fillInAddress() {
  // Get the place details from the autocomplete object.
  var place = autocomplete.getPlace();

  // Get each component of the address from the place details,
  // and then fill-in the corresponding field on the form.
  for (var i = 0; i < place.address_components.length; i++) {
    var addressType = place.address_components[i].types[0];
    if (componentForm[addressType]) {
      var val = place.address_components[i][componentForm[addressType]];
      console.log(val);
    }
  }
}

async function getLatLng(address) {
  return new Promise((resolve) => {
    var geocode = new google.maps.Geocoder();
    geocode.geocode({
      "address": address,
    }, (geocodeResult) => {
      console.log(geocodeResult);
        resolve({
              "lat": geocodeResult[0].geometry.location.lat(),
              "lng": geocodeResult[0].geometry.location.lng(),
        });
      }
    )
  });
}

document.addEventListener('DOMContentLoaded', async function () {
  hsp.init({useTheme: true});

  populateWeatherDiv();
  loadTopBars();
  bindApiButtons();

  hsp.bind('refresh', () => populateWeatherDiv());
  $('[data-toggle="tooltip"]').tooltip();
});

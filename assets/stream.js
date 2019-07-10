let weatherResults = [];

'use strict';

function bindApiButtons() {
  getSingleElementByClassName('hs_showImagePreview').addEventListener('click', function () {
    hsp.showImagePreview(getSingleElementByClassName('hs_showImagePreviewInput').value, 'https://hootsuite.com');
  });

  getSingleElementByClassName('hs_showLightbox').addEventListener('click', function () {
    // similar to showImagePreview
    hsp.showLightbox(getSingleElementByClassName('hs_showLightboxInput').value);
  });

  getSingleElementByClassName('hs_showStatusMessage').addEventListener('click', function () {
    // type can be info, error, warning or success
    hsp.showStatusMessage(getSingleElementByClassName('hs_showStatusMessageInput').value, getSingleElementByClassName('hs_showStatusMessageTypeInput').value);
  });

  getSingleElementByClassName('hs_showUser').addEventListener('click', function () {
    // opens a modal with info about a twitter user
    hsp.showUser(getSingleElementByClassName('hs_showUserInput').value);
  });

  getSingleElementByClassName('hs_composeMessage').addEventListener('click', function () {
    hsp.composeMessage(getSingleElementByClassName('hs_composeMessageInput').value);
  });

  getSingleElementByClassName('hs_saveData').addEventListener('click', function () {
    hsp.saveData(getSingleElementByClassName('hs_saveDataInput').value, function(){});
  });

  getSingleElementByClassName('hs_getData').addEventListener('click', function () {
    hsp.getData(function (data){
      replaceTextInClass('hs_getDataOutput', data);
    });
  });

  getSingleElementByClassName('hs_assignItem').addEventListener('click', function () {
    // Generates a 16 character random string to use as the messageId
    // because the messageId must be unique or Hootsuite will return a 500 error.
    // This can be saved if you'd like to do something using the `sendassignmentupdates` event
    // or with the Assignment Event Request API Callback <https://hootsuite.com/developers/app-directory/docs/api#AER>
    var randomString = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 16; i++) {
      randomString += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    hsp.assignItem({
      messageId: randomString,
      messageAuthor: getSingleElementByClassName('hs_assignMessageAuthor').value,
      messageAuthorAvatar: getSingleElementByClassName('hs_assignMessageAuthorAvatar').value,
      message: getSingleElementByClassName('hs_assignMessage').value
    });
  });

  getSingleElementByClassName('hs_attachFile').addEventListener('click', function () {
    hsp.getMemberInfo(function (data) {
      var timestamp = Math.floor(Date.now() / 1000);
      var url = getSingleElementByClassName('hs_attachFileInput').value;
      var extension = url.split('.');
      if (extension.length !== 0) {
        extension = extension[extension.length - 1];
      } else {
        extension = 'jpg';
      }
      var name = getSingleElementByClassName('hs_attachFileImageName').value;
      var httpRequest = new XMLHttpRequest();
      var once = false;
      // generates a token on the backend because secret must be kept on backend
      httpRequest.open( 'GET',
          window.location.origin +
          '/gen-token?userId=' + encodeURIComponent(data.userId) +
          '&timestamp=' + encodeURIComponent(timestamp) +
          '&url=' + encodeURIComponent(url));
      httpRequest.send();
      httpRequest.onreadystatechange = function () {
        if (httpRequest.responseText !== '' && !once) {
          hsp.attachFileToMessage({
            url: url,
            name: name,
            extension: extension,
            timestamp: timestamp,
            token: httpRequest.responseText
          });
          once = true;
        }
      };
    });
  });

  getSingleElementByClassName('hs_updatePlacementSubtitle').addEventListener('click', function () {
    hsp.updatePlacementSubtitle(getSingleElementByClassName('hs_updatePlacementSubtitleInput').value);
  });

  getSingleElementByClassName('hs_getTwitterAccounts').addEventListener('click', function () {
    hsp.getTwitterAccounts(function (data) {
      var httpRequest = new XMLHttpRequest();
      httpRequest.open(
          'GET',
          window.location.origin + '/twitterAccounts?accountIds=' + data.join()
      );
      httpRequest.setRequestHeader('secretKey', 'super_secret')
      httpRequest.send();
      httpRequest.onreadystatechange = function() {
        replaceTextInClass('hs_getTwitterAccountsOutput', httpRequest.responseText);
      }
    });
  });

  getSingleElementByClassName('hs_retweet').addEventListener('click', function () {
    hsp.getTwitterAccounts(function (data) {
      var splitURL = getSingleElementByClassName('hs_retweetInput').value.split('/');
      var id = splitURL[splitURL.length - 1];
      hsp.retweet(id, data[0]);
    });
  });

  getSingleElementByClassName('hs_showFollowDialog').addEventListener('click', function () {
    hsp.showFollowDialog(getSingleElementByClassName('hs_showFollowDialogName').value, true);
  });

  // getSingleElementByClassName('hs_logout').addEventListener('click', signOut);

  getSingleElementByClassName('hs_showGeolocation').addEventListener('click', function () {
    getGeolocation();
  });
}

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

function parseWeatherJson(weatherJson, id) {
  // 'message' key only exists if there has been an error
  if (weatherJson['message']) {
    // return generic error text
    return {
      "id": id,
      "name": 'City not found',
      "temperature": 'Unknown',
      "weather": 'Unknown',
      "icon": '/assets/question.png',
    }
  }

  return {
    "id": id,
    "temperature": weatherJson['main']['temp'] ||'',
    "weather": weatherJson['weather'][0]['main'] || 'Unknown',
    "name": weatherJson['name'] || 'Unknown Location',
    "icon": `http://openweathermap.org/img/wn/${weatherJson['weather'][0]['icon']}@2x.png`,
  };
}
// TODO: rename classes
// TODO: do all in one loop
function updateSingleWeatherDiv(weather, index) {
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
//
// function generateBoilerplateHTML(index){
//   let weatherDiv = document.getElementById('weather');
//   weatherDiv.insertAdjacentHTML('afterbegin',
//       `<div class="hs_message" id="${index}">
//       <div class="hs_avatar">
//         <img src="http://openweathermap.org/img/wn/10d@2x.png" class="hs_avatarImage" alt="Avatar">
//       </div>
//
//       <div class="hs_content">
//         <p href="#" class="hs_userName"></p>
//         <div class="hs_contentText">
//           <p>
//             <span class="hs_postBody">Loading...</span>
//             <button class="remove_location" onclick="removeLocation(${index});">X</button>
//           </p>
//         </div>
//       </div>
//     </div>`);
//
// }
//

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

    locations.forEach(async (location, index) => {
      // bindRemoveButton(index);

      let weatherJson = await loadWeather(location);
      let weather = parseWeatherJson(weatherJson, index);
      weatherResults.push(weather);
      updateSingleWeatherDiv(weather, index);
    });

    document.getElementById('last_updated').innerHTML = `Last updated: ${new Date()}`
  }
}


document.addEventListener('DOMContentLoaded', async function () {
  hsp.init({useTheme: true});

  populateWeatherDiv();
  loadTopBars();
  bindApiButtons();

  hsp.bind('refresh', () => populateWeatherDiv());
});

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
    console.log('removing all locations');
    hsp.saveData([]);

    clearDivContents('weather');
    document.getElementsByClassName('hs_topBarDropdown')[0].style.display = 'none';
    document.getElementById('no-locations').style.display = 'block';
    document.getElementById('last_updated').innerHTML = 'Last updated: never';
}

function toggleLoading() {
    document.getElementById('loading').style.display = 'none';
}

function displayLoading(display) {
    if(display) {
        document.getElementById('weather').style.display = 'none';
        document.getElementById('loading').style.display = 'block';
    } else {
        document.getElementById('weather').style.display = 'block';
        document.getElementById('loading').style.display = 'none';
    }

}

exports.displayError = displayError;
exports.checkIfLocationValid = checkIfLocationValid;
exports.removeAllLocations = removeAllLocations;
exports.deleteDiv = deleteDiv;
exports.clearDivContents = clearDivContents;
exports.displayLoading = displayLoading;

let weatherResults = [];

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


async function removeAllLocations() {
  weatherResults = [];
  hsp.saveData([], () => {
    clearDivContents('weather');
  });
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

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
  let weatherJson = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&appid=6cfd34fc94e03afb78bee39afd8989bb&units=${settings.units}`);
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
}

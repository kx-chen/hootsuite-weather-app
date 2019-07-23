let weatherApp;

const utils = require('./util.js');
const autocomplete = require('./autocomplete.js');
const constants = require('./constants.js');
const { hsp } = require('./hsp.js');

const Mustache = require('mustache');

function WeatherModel(lat, lng, weatherID, full_name) {
    this.id = weatherID;
    this.temperature = '';
    this.name = '';
    this.icon = '';
    this.weather = '';
    this.lat = lat;
    this.lng = lng;
    this.full_name = full_name;
    this.alerts = [];

    this.init = async () => {
        this.weatherJson = await this.lookup();
        this.weatherResult = await this.parseWeatherResults();
    };

    this.lookup = async () => {
        let weatherJson = await fetch(`${window.origin}/weather/${this.lat}/${this.lng}/ca`)
            .catch(() =>{
                utils.displayError({
                    "message": constants.dialog.generic_error
                }, false);
                document.getElementById('loading').style.display = 'none';
        });

        if (weatherJson.status === 200) {
            return await weatherJson.json();
        }

        utils.displayError({
            "message": constants.dialog.generic_error
        }, false);

        document.getElementById('loading').style.display = 'none';
        return false;
    };

    this.parseWeatherResults = async () => {
        this.temperature = Math.round(this.weatherJson['currently']['temperature']);
        this.weather = this.weatherJson['currently']['summary'];
        this.icon = `https://darksky.net/images/weather-icons/${this.weatherJson['currently']['icon']}.png`;
        if(this.weatherJson['alerts']) this.alerts = this.weatherJson['alerts'];
    };
}


function WeatherView(weatherModel) {
    this.weather = weatherModel;

    this.render = () => {
        let weatherDiv = document.getElementById('weather');

        weatherDiv.insertAdjacentHTML('afterbegin', Mustache.render(constants.html.weather_entry, this.weather));

        if(this.weather['alerts'].length > 0) {
            console.log(this.weather.alerts);
            document.getElementById(this.weather.id).insertAdjacentHTML('beforeend', Mustache.render(constants.html.weather_alert, this.weather));
        }
    };
}


function WeatherController() {
    this.weatherModels = [];

    this.getLocations = async () => {
        return new Promise((resolve) => {
            hsp.getData((data) => {
                if(data) {
                    resolve(data);
                } else {
                    resolve([]);
                }
            });
        }).catch((err) => console.log(err));
    };

    this.displayLoading = (display) => {
        if(display) {
            document.getElementById('weather').style.display = 'none';
            document.getElementById('loading').style.display = 'block';
        } else {
            document.getElementById('weather').style.display = 'block';
            document.getElementById('loading').style.display = 'none';
        }

    };

    this.refresh = async () => {
        this.locations = await this.getLocations();
        this.weatherModels = [];

        if(this.locations.length > 0) {
            document.getElementById('no-locations').style.display = 'none';
        }
       this.displayLoading(true);

        if (this.locations.length) {
            utils.clearDivContents('weather');

            for (let i = 0; i < this.locations.length; i++) {
                if (this.locations[i]) {
                    let lat = this.locations[i].lat;
                    let lng = this.locations[i].lng;
                    let full_name = this.locations[i].full_name;

                    let model = new WeatherModel(lat, lng, i, full_name);
                    await model.init();

                    new WeatherView(model).render();
                    this.weatherModels.push(model);
                }
            }
            this.updateLastUpdated();
        }

        this.displayLoading(false);
    };

    this.updateLastUpdated = () => {
        document.getElementById('last_updated').innerHTML = `Last updated: ${new Date()}`;
    };

    this.getLocationToAdd = async () => {
        let address = await autocomplete.getAutocompleteAddress();
        let lookupGeometry = await autocomplete.getLatLng(address);
        // TODO: rename
        let res = await utils.checkIfLocationValid({
            "lat": lookupGeometry.lat,
            "lng": lookupGeometry.lng,
        });

        if(res) {
            return {
                "geometry": lookupGeometry,
                "address": address,
            };
        }
        return false;
    };

    this.addLocation = async () => {
        let lookupGeometry = await this.getLocationToAdd();

        if (!lookupGeometry) {
            utils.displayError({
                "message": constants.dialog.location_not_found,
            });
            return;
        }

        let locations = await this.getLocations();
        if (!locations) {
            locations = [];
        }

        // TODO: extract into a constant
        if (locations.length >= constants.limits.max_locations) {
            utils.displayError({
                "message": constants.dialog.too_many_locations,
            }, true);
            return;
        }
        for(let i = 0; i < locations.length; i++) {
            let latInt = parseFloat(locations[i].lat);
            let lngInt = parseFloat(locations[i].lng);
            if (latInt === lookupGeometry.geometry.lat && lngInt === lookupGeometry.geometry.lng) {
                utils.displayError({
                    "message": constants.dialog.location_already_exists
                });
                return;
            }
        }
        locations.push({
            "full_name": lookupGeometry.address,
            "lat": lookupGeometry.geometry.lat,
            "lng": lookupGeometry.geometry.lng,
        });
        document.getElementById('autocomplete').value = '';

        if(locations.length > 0) {
            document.getElementById('no-locations').style.display = 'none';
        }

        hsp.saveData(locations, () => {
            this.refresh();
        });
        return locations;
    };

    this.removeLocation = async (index) => {
        utils.deleteDiv(index);

        let locationsList = [];

        this.weatherModels = this.weatherModels.filter((result) => {
            return !(result.id === index);
        });

        this.weatherModels.forEach((result) => {
            locationsList.push({
                "full_name": result.full_name,
                "lat": result.lat,
                "lng": result.lng,
            });
        });

        if(locationsList.length === 0) {
            document.getElementById('no-locations').style.display = 'block';
            document.getElementById('last_updated').innerHTML = 'Last updated: never';
        }

        hsp.saveData(locationsList);
    };
}

function init() {
    global.weatherApp = new WeatherController();
    global.weatherApp.refresh();
}


exports.WeatherController = WeatherController;
exports.WeatherView = WeatherView;
exports.WeatherModel = WeatherModel;
exports.init = init;

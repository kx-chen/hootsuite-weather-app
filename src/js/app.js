const autocomplete = require('./autocomplete.js');
const constants = require('./constants.js');
const { hsp } = require('./hsp.js');
const utils = require('./util.js');

const Mustache = require('mustache');


function WeatherModel(lat, lng, weatherID, full_name) {
    this.id = weatherID;
    this.lat = lat;
    this.lng = lng;
    this.full_name = full_name;
    this.alerts = [];

    this.init = async () => {
        this.weatherJson = await this.lookup();
        this.weatherResult = await this.parseWeatherResults();
    };

    this.lookup = async () => {
        let weatherJson = await fetch(window.origin + Mustache.render(constants.urls.weather_lookup, this))
            .catch(() =>{
                utils.displayError({
                    "message": constants.dialog.generic_error
                }, false);
                utils.displayLoading(false);
        });

        if (weatherJson.status === 200) {
            return await weatherJson.json();
        }

        utils.displayError({
            "message": constants.dialog.generic_error
        }, false);

        utils.displayLoading(false);
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

        weatherDiv
            .insertAdjacentHTML('afterbegin',
                                Mustache.render(
                                    constants.html.weather_entry,
                                    this.weather));

        if(this.weather['alerts'].length > 0) {
            document.getElementById(this.weather.id)
                .insertAdjacentHTML('beforeend',
                    Mustache.render(constants.html.weather_alert, this.weather));
        }
    };
}


function WeatherController() {
    this.weatherModels = [];

    this.getLocations = async () => {
        return new Promise((resolve) => {
            hsp.getData((data) => {
                data ? resolve(data) : resolve([])
            });
        }).catch((err) => {
            console.log(err);
            utils.displayError({
                "message": constants.dialog.error_getting_saved_locations
            })
        });
    };

    this.refresh = async () => {
        this.locations = await this.getLocations();
        this.weatherModels = [];

        if(this.locations.length > 0) {
            document.getElementById('no-locations').style.display = 'none';
        }
       utils.displayLoading(true);

        if (this.locations.length) {
            utils.clearDivContents('weather');

            for (let i = 0; i < this.locations.length; i++) {
                if (this.locations[i]) {
                    let model = new WeatherModel(this.locations[i].lat,
                                                 this.locations[i].lng,
                                                 i,
                                                this.locations[i].full_name);
                    await model.init();

                    new WeatherView(model).render();
                    this.weatherModels.push(model);
                }
            }
            this.updateLastUpdated();
        }

        utils.displayLoading(false);
    };

    this.updateLastUpdated = () => {
        document.getElementById('last_updated').innerHTML = `Last updated: ${new Date()}`;
    };

    this.getLocationToAdd = async () => {
        let address = await autocomplete.getAutocompleteAddress();
        let lookupGeometry = await autocomplete.getLatLng(address);
        let res = await utils.checkIfLocationValid(new Location(lookupGeometry.lat, lookupGeometry.lng));

        if(res) {
            return {
                "geometry": lookupGeometry,
                "address": address,
            };
        }
        return false;
    };

    this.addLocation = async () => {
        let error = false;
        let lookupGeometry = await this.getLocationToAdd();
        let locations = await this.getLocations();

        if (!locations) {
            locations = [];
        }

        await this.validateLocations(locations, lookupGeometry)
            .catch((err) => {
                utils.displayError({
                    "message": err.message,
                });
                error = true;
            });

        if(error){
            return;
        }

        locations.push(new Location(lookupGeometry.geometry.lat, lookupGeometry.geometry.lng, lookupGeometry.address));
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
            locationsList.push(new Location(result.lat, result.lng, result.full_name));
        });

        // TODO: extract into function
        if(locationsList.length === 0) {
            document.getElementById('no-locations').style.display = 'block';
            document.getElementById('last_updated').innerHTML = 'Last updated: never';
        }

        hsp.saveData(locationsList);
    };

    this.validateLocations = async (locations, lookupGeometry) => {
        return new Promise((resolve, reject) => {
            if (!lookupGeometry) {
                reject({
                    "message": constants.dialog.location_not_found,
                });
            }

            if (locations.length >= constants.limits.max_locations) {
                reject({
                    "message": constants.dialog.too_many_locations,
                });
            }

            for(let i = 0; i < locations.length; i++) {
                let latInt = parseFloat(locations[i].lat);
                let lngInt = parseFloat(locations[i].lng);

                if (latInt === lookupGeometry.geometry.lat && lngInt === lookupGeometry.geometry.lng) {
                    reject({
                        "message": constants.dialog.location_already_exists,
                    });
                }
            }
            resolve();
        });
    };
}

function Location(lat, lng, full_name) {
    this.full_name = full_name;
    this.lat = lat;
    this.lng = lng;
}

function init() {
    global.weatherApp = new WeatherController();
    global.weatherApp.refresh();
}


exports.WeatherController = WeatherController;
exports.WeatherView = WeatherView;
exports.WeatherModel = WeatherModel;
exports.init = init;

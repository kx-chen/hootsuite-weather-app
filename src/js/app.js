import autocomplete from './autocomplete.js';
import constants from './constants.js';
import { hsp } from './hsp.js';
import utils from './util.js';
import Mustache from 'mustache';

/**
 * Holds the data for each weather result/city.
 * @class
 * @param {float} lat - Latitude of the location
 * @param {float} lng - Longitude of the location
 * @param {int} weatherID - The ID of the model, used as the HTML ID for the result
 * @param {string} full_name - Full name of the city/location
 */
class WeatherModel {
    constructor(lat, lng, weatherID, full_name) {
        this.id = weatherID;
        this.lat = lat;
        this.lng = lng;
        this.full_name = full_name;
        this.alerts = [];
    }

    /**
     * Initializes the WeatherModel by fetching and parsing the weather using the lat and lng.
     * @async
     */
    async init() {
        this.weatherJson = await this.lookup();
        this.weatherResult = await this.parseWeatherResults();
    }

    /**
     * Fetches and saves the weather info by calling the weather api.
     * @async
     * @returns {object} JSON from the weather api.
     */
    async lookup() {
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
    }

    /**
     * Parses the JSON returned from the weather api and saves the required data.
     * @async
     */
    async parseWeatherResults() {
        this.temperature = Math.round(this.weatherJson['currently']['temperature']);
        this.weather = this.weatherJson['currently']['summary'];
        this.icon = `https://darksky.net/images/weather-icons/${this.weatherJson['currently']['icon']}.png`;
        if(this.weatherJson['alerts']) {
            this.alerts = this.weatherJson['alerts'];
        }
    }
}

/**
 * Responsible for displaying and rendering the weather info to the HTML.
 * @class
 * @param {WeatherModel} weatherModel - Data to be rendered in
 */
class WeatherView {
    constructor(weatherModel) {
        this.weather = weatherModel;
    }

    /**
     * Renders the weather data and alerts.
     * @async
     */
    render() {
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
    }
}

/**
 * Controller responsible for the overall logic of the app.
 * @class
 */
class WeatherController {
    constructor() {
        this.weatherModels = [];
    }

    /**
     * Fetches the user saved locations from the Hootsuite SDK.
     * @async
     * @returns {array} Array of saved Location objects.
     */
    async getLocations() {
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
    }

    /**
     * Refreshes the weather results on the page.
     * @async
     */
    async refresh() {
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
    }

    /**
     * Updates the 'last updated' time on page.
     */
    updateLastUpdated() {
        document.getElementById('last_updated').innerHTML = `Last updated: ${new Date()}`;
    }

    /**
     * Gets the lat/lng and address of the location typed into the 'add location' form.
     * @async
     * @returns {object} Geometry (lat/lng) and address of location to be added.
     */
    async getLocationToAdd() {
        let address = await autocomplete.getAutocompleteAddress();
        let lookupGeometry = await autocomplete.getLatLng(address);
        let res = await utils.checkIfLocationValid(new Location(lookupGeometry.lat, lookupGeometry.lng));

        // TODO: Change into object
        if(res) {
            return {
                "geometry": lookupGeometry,
                "address": address,
            };
        }
        return false;
    }

    /**
     * Saves, validates and updates the location just added by the user.
     * @async
     * @returns {array} Saved locations by the user, including the newly added one.
     */
    async addLocation() {
        let error = false;
        let lookupGeometry = await WeatherController.prototype.getLocationToAdd();
        let locations = await WeatherController.prototype.getLocations();

        if (!locations) {
            locations = [];
        }

        await WeatherController.prototype.validateLocations(locations, lookupGeometry)
            .catch(({message}) => {
                utils.displayError({
                    "message": message,
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
            WeatherController.prototype.refresh();
        });
        return locations;
    }

    /**
     * Removes the location specified by ID.
     * @async
     * @param {int} index - Index of the location to remove.
     */
    async removeLocation(index) {
        utils.deleteDiv(index);

        let locationsList = [];

        this.weatherModels = this.weatherModels.filter(({id}) => !(id === index));

        this.weatherModels.forEach(({lat, lng, full_name}) => {
            locationsList.push(new Location(lat, lng, full_name));
        });

        // TODO: extract into function
        if(locationsList.length === 0) {
            document.getElementById('no-locations').style.display = 'block';
            document.getElementById('last_updated').innerHTML = 'Last updated: never';
        }

        hsp.saveData(locationsList);
    }

    /**
     * Validate the location about to be added.
     * @async
     * @param {array} locations - List of currently saved locations.
     * @param {object} lookupGeometry - Lat/lng and address of the location about to be added.
     * @returns {array} Array of saved Location objects.
     */
    async validateLocations(locations, lookupGeometry) {
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
    }
}


/**
 * Respresents a saved location, storing its lat/lng and full name.
 * @class
 * @param {float} lat - Latitude of location.
 * @param {float} lng - Longitude of location.
 * @param {string} full_name - Full name/address of the location.
 */
function Location(lat, lng, full_name) {
    this.full_name = full_name;
    this.lat = lat;
    this.lng = lng;
}

function init() {
    global.weatherApp = new WeatherController();
    global.weatherApp.refresh();
}


export {WeatherController};
export {WeatherView};
export {WeatherModel};
export {init};
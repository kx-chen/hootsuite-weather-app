const utils = require('./util.js');
const autocomplete = require('./autocomplete.js');
const constants = require('./constants.js');
const menus = require('./menus.js');
const index = require('./index.js');
const app = require('./app.js');
const { hsp } = require('./hsp.js');

// TODO: setup better
global.utils = utils;
global.autocomplete = autocomplete;

module.exports = {
    WeatherModel: app.WeatherModel,
    WeatherView: app.WeatherView,
    WeatherController: app.WeatherController,
};

document.addEventListener('DOMContentLoaded',  () => {
    hsp.init({useTheme: true});
    app.init();
    menus.loadTopBars();

    hsp.bind('refresh', () => weatherApp.refresh());
});

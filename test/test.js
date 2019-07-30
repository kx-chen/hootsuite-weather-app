const assert = require('assert');
const constants = require('../src/js/constants');
const fakeTestObjects = require('./fakeTestObjects');

const sinon = require('sinon');
global.fetch = require('node-fetch');

const {
    WeatherModel,
    WeatherController,
    WeatherView,
} = require('../src/js/bundle');

describe('WeatherView', () => {
    before(() => {
        document.body.innerHTML = '<div id="weather"></div>';
    });

    after(() => {
        sinon.restore();
    });

    it('renders WeatherModels', () => {
        let model = new WeatherModel(49, 123, 0, 'Vancouver');
        model.full_name = 'Vancouver';
        model.weather = 'Rainy';
        model.icon = 'rainy';

        new WeatherView(model).render();

        let cityName = document.getElementsByClassName('hs_userName')[0].innerHTML;
        assert.equal(cityName, 'Vancouver');
    });

    it('renders alerts', () => {
        let alertsModel = new WeatherModel(49, 123, 1, 'Bolly World');
        alertsModel.full_name = 'Bolly World';
        alertsModel.weather = 'Bolly';
        alertsModel.icon = 'weather-icon';
        alertsModel.alerts = [
            {
                "title": "Raining Pigs Alert",
                "uri": "pigs.com"
            }
        ];

        new WeatherView(alertsModel).render();

        let alertBody = document.getElementById('alert-body');
        assert.equal(alertBody.innerHTML, 'Raining Pigs Alert');
        assert.equal(alertBody.href, 'pigs.com');
    });
});


describe('WeatherController', () => {
    beforeEach( () => {
        document.body.innerHTML = '<div id="weather">' +
            '<form><input id="autocomplete" value="Vancouver, BC, Canada">' +
            '</form>' +
            '</div>' +
            '<div id="alerts"></div>' +
            '<div id="no-locations"></div>' +
            '<div id="loading"></div>';
    });

    afterEach(() => {
        sinon.restore();
    });

    it('fails on unknown locations', async () => {
        let controller = new WeatherController();

        let fakeUnsuccessfulLocation = sinon.fake.returns(false);
        let fakeLocations = sinon.fake.returns([]);
        sinon.replace(WeatherController.prototype, 'getLocationToAdd', fakeUnsuccessfulLocation);
        sinon.replace(WeatherController.prototype, 'getLocations', fakeLocations);

        await controller.addLocation();

        assert(fakeUnsuccessfulLocation.called);
        assert(document.getElementById('error-alert'));
        assert(document.getElementById('error-alert')
            .innerHTML.includes(constants.dialog.location_not_found));
    });

    it('deletes old locations', () => {

    });

    it('saves new locations', async () => {
        let controller = new WeatherController();

        let fakeLocations = sinon.fake.returns(fakeTestObjects.fakeLocation2);
        sinon.replace(WeatherController.prototype, 'getLocations', fakeLocations);

        let fakeLookup = sinon.fake.returns(fakeTestObjects.fakeLookup1);
        sinon.replace(WeatherController.prototype, 'getLocationToAdd', fakeLookup);

        let result = await controller.addLocation();
        assert.equal(result.length, 2);
        assert.equal(result[1].full_name,
            fakeTestObjects.fakeLookup1.address);
        assert.equal(document.getElementById('autocomplete').value, '');
    });

    it('rejects duplicates', async () => {
        let controller = new WeatherController();

        let fakeLocations = sinon.fake.returns(fakeTestObjects.fakeLocation1);
        sinon.replace(WeatherController.prototype, 'getLocations', fakeLocations);

        let fakeSuccessfulLocation = sinon.fake.returns(fakeTestObjects.fakeLookup1);
        sinon.replace(WeatherController.prototype, 'getLocationToAdd', fakeSuccessfulLocation);

        await controller.addLocation();
        assert(document.body.innerHTML.includes(constants.dialog.location_already_exists));
    });

    it('renders all locations', async () => {
        let controller = new WeatherController();

        let fakeLocations = sinon.fake.returns(fakeTestObjects.fakeLocations);
        sinon.replace(controller, 'getLocations', fakeLocations);
        sinon.replace(controller, 'updateLastUpdated', sinon.fake());

        sinon.stub(global, 'fetch').callsFake(() => {
            return new Promise((resolve) => {
               resolve(fakeTestObjects.fakeWeatherResponse);
            });
        });

        await controller.refresh();
        // TODO: proper assertions
        assert(document.getElementById('0'));
        assert(document.getElementById('1'));
    });

    it('remove all locations', () => {

    });
});

describe('WeatherModel', () => {
    it('fetches location data', async () => {
        sinon.stub(global, 'fetch').callsFake(() => {
            return new Promise((resolve) => {
                resolve(fakeTestObjects.fakeWeatherResponse);
            });
        });

        let model = new WeatherModel(1.11, 2.22, 0, "Generic Location");
        await model.init();

    });

    it('displays error on fail', () => {

    });

    it('parses weather json', () => {

    });
});

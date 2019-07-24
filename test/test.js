const assert = require('assert');
const sinon = require('sinon');
const constants = require('../src/js/constants');
const fakeTestObjects = require('./fakeTestObjects');
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

    after(() => {
        sinon.restore();
    });

    it('fails on unknown locations', async () => {
        let controller = new WeatherController();

        let fakeUnsuccessfulLocation = sinon.fake.returns(false);
        let fakeLocations = sinon.fake.returns([]);
        sinon.replace(controller, 'getLocationToAdd', fakeUnsuccessfulLocation);
        sinon.replace(controller, 'getLocations', fakeLocations);

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

        let fakeLocations = sinon.fake.returns([
            {
                "lat": 49.393,
                "lng": -123.493,
                "full_name": "Vancouver, BC, Canada",
            }
        ]);
        sinon.replace(controller, 'getLocations', fakeLocations);

        let fakeSuccessfulLocation = sinon.fake.returns({
            "geometry": {
                "lat": 39.30,
                "lng": -13.493,
            },
            "address": "San Francisco, California, USA",
        });
        sinon.replace(controller, 'getLocationToAdd', fakeSuccessfulLocation);

        let result = await controller.addLocation();
        assert.equal(result.length, 2);
        assert.equal(result[1].full_name,
            "San Francisco, California, USA");
        assert.equal(document.getElementById('autocomplete').value, '');
    });

    it('rejects duplicates', async () => {
        let controller = new WeatherController();

        let fakeLocations = sinon.fake.returns([
            {
                "lat": 49.393,
                "lng": -123.493,
                "full_name": "Duplicate",
            }
        ]);
        sinon.replace(controller, 'getLocations', fakeLocations);

        let fakeSuccessfulLocation = sinon.fake.returns({
            "geometry": {
                "lat": 49.393,
                "lng": -123.493,
            },
            "address": "Duplicate",
        });
        sinon.replace(controller, 'getLocationToAdd', fakeSuccessfulLocation);

        await controller.addLocation();
        assert(document.body.innerHTML.includes(constants.dialog.location_already_exists));
    });

    it('renders all locations', async () => {
        let controller = new WeatherController();

        let fakeLocations = sinon.fake.returns([
            {
                "lat": 1.111,
                "lng": 1.111,
                "full_name": "Location 1",
            },
            {
                "lat": 2.222,
                "lng": 2.222,
                "full_name": "Location 2",
            }
        ]);
        sinon.replace(controller, 'getLocations', fakeLocations);
        sinon.replace(controller, 'updateLastUpdated', sinon.fake());

        // TODO: replace with fake response obj
        sinon.stub(global, 'fetch').callsFake(() => {
            return new Promise((resolve) => {
               resolve({
                   "status": 200,
                   "json": () => {
                       return {
                           "currently": {
                               "temperature": 30.00,
                               "summary": "raining pigs",
                               "icon": "pigs",
                           }
                       }
                   }
               });
            });
        });

        await controller.refresh();
        assert(document.getElementById('0'));
        assert(document.getElementById('1'));
    });

    it('remove all locations', () => {

    });
});

describe('WeatherModel', () => {
    it('fetches location data', () => {
        sinon.stub(global, 'fetch').callsFake(() => {
            return new Promise((resolve) => {
                resolve({
                    "status": 200,
                    "json": () => {
                        return {
                            "currently": {
                                "temperature": 30.00,
                                "summary": "raining pigs",
                                "icon": "pigs",
                            }
                        }
                    }
                });
            });
        });

    });

    it('displays error on fail', () => {

    });

    it('parses weather json', () => {

    });
});

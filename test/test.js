const assert = require('assert');
const sinon = require('sinon');

const { WeatherModel, WeatherController, WeatherView, } = require('../src/js/bundle.js');

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

      let alertTitle = document.getElementById('alert-title').innerHTML;
      let alertUrl = document.getElementById('alert-url').href;
      assert.equal(alertTitle, 'Raining Pigs Alert');
      assert.equal(alertUrl, 'pigs.com');
   });
});


describe('WeatherController', () => {
   before(() => {
      document.body.innerHTML = '<div id="weather">' +
          '<form><input id="autocomplete" value="Vancouver, BC, Canada"></input>' +
          '</form>' +
          '<div id="alerts"></div>' +
          '<div id="no-locations"></div>' +
          '</div>';
      // sinon.replace(document, 'getElementById', sinon.fake(document.getElementById));
   });

   after(() => {
      sinon.restore();
   });

   it('fails on unknown locations', async () => {
      let controller = new WeatherController();

      let fakeUnsuccessfulLocation = sinon.fake.returns(false);
      sinon.replace(controller, 'getLocationToAdd', fakeUnsuccessfulLocation);

      await controller.addLocation();

      assert(fakeUnsuccessfulLocation.called);
      assert(document.getElementById('error-alert'));
      assert(document.getElementById('error-alert')
          .innerHTML.includes("Location not found"));
   });

   it('deletes old locations', () => {

   });

   it('adds new locations', async () => {
      let controller = new WeatherController();

      let fakeLocations = sinon.fake.returns([
         {
            "lat": 49.393,
            "lng": -123.493,
            "full_name": "Vancouver",
         }
      ]);
      sinon.replace(controller, 'getLocations', fakeLocations);

      let fakeSuccessfulLocation = sinon.fake.returns({
         "geometry": {
            "lat": 49.393,
            "lng": -123.493,
         },
         "address": "Vancouver, BC, Canada",
      });
      sinon.replace(controller, 'getLocationToAdd', fakeSuccessfulLocation);

      await controller.addLocation();
   });
});

describe('WeatherModel', () => {
   it('fetches location data', () => {

   });

   it('displays error on fail', () => {

   });

   it('parses weather json', () => {

   });
});

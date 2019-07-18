const assert = require('assert');
const app = require('../src/js/app.js');

const sinon = require('sinon');

describe('WeatherView', () => {
   before(() => {
      document.body.innerHTML = '<div id="weather"></div>';
      sinon.replace(document, 'getElementById', sinon.fake(document.getElementById));
   });

   after(() => {
      sinon.restore();
   });

   it('renders WeatherModels', () => {
      let model = new app.WeatherModel(49, 123, 0, 'Vancouver');
      model.full_name = 'Vancouver';
      model.weather = 'Rainy';
      model.icon = 'rainy';

      new app.WeatherView(model).render();

      let cityName = document.getElementsByClassName('hs_userName')[0].innerHTML;
      assert.equal(cityName, 'Vancouver');
   });

   it('renders alerts', () => {
      let alertsModel = new app.WeatherModel(49, 123, 1, 'Bolly World');
      alertsModel.full_name = 'Bolly World';
      alertsModel.weather = 'Bolly';
      alertsModel.icon = 'weather-icon';
      alertsModel.alerts = [
         {
            "title": "Raining Pigs Alert",
            "uri": "pigs.com"
         }
      ];

      new app.WeatherView(alertsModel).render();

      let alertTitle = document.getElementById('alert-title').innerHTML;
      let alertUrl = document.getElementById('alert-url').href;
      assert.equal(alertTitle, 'Raining Pigs Alert');
      assert.equal(alertUrl, 'pigs.com');
   });
});


describe('WeatherController', () => {
   it('adds new locations', () => {

   });

   it('deletes old locations', () => {

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

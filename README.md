# Hootsuite Weather App
[![Build Status](https://travis-ci.com/kx-chen/hs-weather-app.svg?branch=master)](https://travis-ci.com/kx-chen/hs-weather-app)

> Get weather results right in your Hootsuite dashboard!
## Structure

`src/js/`

Main JavaScript code for the app is here, including utils, some libraries, etc.

`src/js/app.js`

The actual code for the app. 

`tests/`

Tests for the app.

`index.js`

Backend/node server for the app. 

`views/`

Contains the HTML templates for the app.

TODO: 
- [ ] Change class names in HTML from `hs_*`
- [x] Remove repetition in tests, especially with the dummy data and dummy response JSON
- [x] Remove inline HTML
- [ ] Refactor return types of responses/geocode results to proper objects
    - [x] in tests
    - [ ] in app code
- [ ] Add eventlisteners instead of using `onclick` in HTML
- [x] Extract all error messages, class selectors, strings, urls into own file
- [ ] Shorten code to under 80 columns


Possible improvements: 
- Comparison with already existing WeatherModels when adding new locations so 
all locations don't have to refresh when adding a new location

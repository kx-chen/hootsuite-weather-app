const constants = require('./constants');
const utils = require('./util');
let componentForm = {
    street_number: 'short_name',
    route: 'long_name',
    locality: 'long_name',
    administrative_area_level_1: 'short_name',
    country: 'long_name',
    postal_code: 'short_name'
};


function geolocate() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            let geolocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            let circle = new google.maps.Circle(
                {center: geolocation, radius: position.coords.accuracy});
            autocomplete.setBounds(circle.getBounds());
        });
    }
}


function getLatLng(address) {
    return new Promise((resolve) => {
        let geocode = new google.maps.Geocoder();
        geocode.geocode({
                "address": address,
            }, (geocodeResult) => {
                resolve({
                    "lat": geocodeResult[0].geometry.location.lat(),
                    "lng": geocodeResult[0].geometry.location.lng(),
                });
            }
        )
    });
}


function getAutocompleteAddress() {
    return new Promise((resolve) => {
        let place = autocomplete.getPlace();
        let address = "";

        if(place.address_components) {
            for (let i = 0; i < place.address_components.length; i++) {
                let addressType = place.address_components[i].types[0];
                if (componentForm[addressType]) {
                    let val = place.address_components[i][componentForm[addressType]];
                    address += val + ", ";
                }
            }
            resolve(address);
        } else {
            utils.displayError({
                "message": constants.dialog.error_geocoding,
            });
        }
    });
}

exports.getAutocompleteAddress = getAutocompleteAddress;
exports.getLatLng = getLatLng;
exports.geolocate = geolocate;

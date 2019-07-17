let autocomplete;

let componentForm = {
    street_number: 'short_name',
    route: 'long_name',
    locality: 'long_name',
    administrative_area_level_1: 'short_name',
    country: 'long_name',
    postal_code: 'short_name'
};


function initAutocomplete() {
    autocomplete = new google.maps.places.Autocomplete(
        document.getElementById('autocomplete'), {types: ['(cities)']});

    autocomplete.setFields(['address_component']);

    autocomplete.addListener('place_changed', weatherApp.addLocation);
}


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
            displayError({
                "message": "Sorry, that location could not be found. Please select a location from the suggestions.",
            })
        }
    });
}

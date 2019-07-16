var placeSearch, autocomplete;

var componentForm = {
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
            var geolocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            var circle = new google.maps.Circle(
                {center: geolocation, radius: position.coords.accuracy});
            autocomplete.setBounds(circle.getBounds());
        });
    }
}


async function getLatLng(address) {
    return new Promise(async (resolve) => {
        var geocode = new google.maps.Geocoder();
        let address2 = await fillInAddress();
        console.log(address2);
        geocode.geocode({
                "address": address2,
            }, (geocodeResult) => {
                console.log(geocodeResult);
                resolve({
                    "lat": geocodeResult[0].geometry.location.lat(),
                    "lng": geocodeResult[0].geometry.location.lng(),
                });
            }
        )
    });
}


async function fillInAddress() {
    return new Promise((resolve) => {
        // Get the place details from the autocomplete object.
        var place = autocomplete.getPlace();
        let address = "";

        // Get each component of the address from the place details,
        // and then fill-in the corresponding field on the form.
        if(place.address_components) {
            for (var i = 0; i < place.address_components.length; i++) {
                var addressType = place.address_components[i].types[0];
                if (componentForm[addressType]) {
                    var val = place.address_components[i][componentForm[addressType]];
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

const fakeWeatherResponse = {
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
};

const fakeLocations = [
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
];

const fakeLocation1 = [
    {
        "lat": 49.393,
        "lng": -123.493,
        "full_name": "Duplicate",
    }
];

const fakeLocation2 = [
    {
        "lat": 2,
        "lng": 2,
        "full_name": "Vancouver, BC, Canada",
    }
];

const fakeLookup1 = {
    "geometry": {
        "lat": 49.393,
        "lng": -123.493,
    },
    "address": "Somewhere",
};

exports.fakeWeatherResponse = fakeWeatherResponse;
exports.fakeLocations = fakeLocations;
exports.fakeLocation1 = fakeLocation1;
exports.fakeLocation2 = fakeLocation2;
exports.fakeLookup1 = fakeLookup1;

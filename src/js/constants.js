const dialog = {
    "generic_error": "Sorry, something went wrong!",
    "location_not_found": "Location not found, please try again.",
    "too_many_locations": "Sorry, you can't add more than 10 locations!",
    "location_already_exists": "Location already exists!",
};

const limits = {
  "max_locations": 10
};

const urls = {
    "weather_base_url": "",
    "more_info_url": "",
};

const html = {
    "weather_entry": `<div class="hs_message" id="{{id}}">
                  <div class="hs_avatar">
                    <img src="{{icon}}" class="hs_avatarImage" alt="Avatar">
                  </div>

                  <div class="hs_content">
                    <a onclick="hsp.showCustomPopup('https://hs-weather-app.herokuapp.com/weather-widget/{{lat}}/{{lng}}',
                    'Weather for {{full_name}}');" class="hs_userName" target="_blank">{{full_name}}</a>

                    <div class="hs_contentText">
                      <p>
                        <span class="hs_postBody">{{temperature}} Degrees | {{weather}}</span>
                        <span class="remove_location close icon-app-dir x-clear"
                                onclick="weatherApp.removeLocation({{id}});"></span>
                      </p>
                    </div>
                  </div>
                </div>`,

    "weather_alert": `<div class="alert alert-info fade show" role="alert">
                            {{#alerts}}
                            <p>
                             <a id="alert-body" href="{{uri}}" target="_blank">{{title}}</a>
                           </p>
                           {{/alerts}}
                       </div>
    `
};

exports.html = html;
exports.dialog = dialog;
exports.limits = limits;

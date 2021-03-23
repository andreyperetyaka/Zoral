const https = require('https');
const readline = require('readline-sync');

/**
 * Returns Promise of requested data
 * @param {Object} options request options should include hostname, path, method, headers and body.
 */
function getData(options) {
  return new Promise((resolve, reject) => {
    let data = '';
    https
      .request(options, (response) => {
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          resolve(JSON.parse(data.toString()));
        });
      })
      .on('error', (error) => reject(error))
      .end(JSON.stringify(options.body));
  });
}

/**
 * Make request to Google OAuth API with credentials and return Promise of Response
 */
function getAccessToken() {
  const options = {
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    body: {
      client_id:
        '1054788709652-df1677dkduiujvfe8aako38j36s8uii9.apps.googleusercontent.com',
      client_secret: 'r9D2C2qCvBcGmjycr0GyDEFc',
      refresh_token:
        '1//09r3uddgYOedyCgYIARAAGAkSNwF-L9Irw0QpHh0-paI7fd9vEUYTHHln2RC_Fp0t_sDNuSkhuEOxVRPVLSxn9Asjp6hLlpLcy0o',
      grant_type: 'refresh_token',
    },
  };
  return getData(options);
}

/**
 * Forces user to input Date in correct format ;-)
 * @param {String} message Describes what kind of Date value is needed.
 */
function getValidDate(message) {
  try {
    return new Date(
      readline.question(
        `Please enter ${message} (in format YYYY-MM-DD HH:MM:SS): `
      )
    ).toISOString();
  } catch (error) {
    console.log(error.message);
    return getValidDate(message);
  }
}

/**
 * Make a Calendar API call and returns Promise of Response
 * @param {String} token OAuth2 access token string.
 * @param {Object} body Object with timeMin, timeMax and items values.
 */
function getBusyTimeSlots(token, body) {
  let freeBusyOptions = {
    hostname: 'www.googleapis.com',
    path: '/calendar/v3/freeBusy',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  };
  return getData(freeBusyOptions);
}

// main IIFE function
(function () {
  let timeMin = getValidDate('starting moment');
  let timeMax = getValidDate('ending moment');
  let id = readline.question('Please enter the calendar id: ');
  let body = {
    timeMin,
    timeMax,
    items: [{ id }],
  };
  getAccessToken()
    .then((response) => response.access_token)
    .then((token) => getBusyTimeSlots(token, body))
    .then((response) => {
      if (response.error) throw new Error(response.error.message);
      if (response.calendars[id].errors)
        throw new Error('Requested data is not found');
      let intervals = response.calendars[id].busy;
      if (intervals.length) {
        console.log('Here is an array of busy intervals:');
        console.log(intervals);
      } else {
        console.log('There are no busy intervals');
      }
    })
    .catch((error) => console.log(error.message));
})();

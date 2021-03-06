const fs = require('fs');
const readline = require('readline-sync');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Calendar API.
  authorize(JSON.parse(content), getBusyTimeSlots);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  let code = readline.question(
    'Enter the code parameter from that page url here: '
  );
  oAuth2Client.getToken(code, (err, token) => {
    if (err) return console.error('Error retrieving access token', err);
    oAuth2Client.setCredentials(token);
    // Store the token to disk for later program executions
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
      if (err) return console.error(err);
      console.log('Token stored to', TOKEN_PATH);
    });
    callback(oAuth2Client);
  });
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
 * Prompts user for aditional arguments and makes a Calendar API call
 * Prints response to Console
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function getBusyTimeSlots(auth) {
  const calendar = google.calendar({ version: 'v3', auth });
  let timeMin = getValidDate('starting moment');
  let timeMax = getValidDate('ending moment');
  let id = readline.question('Please enter the calendar id: ');
  const request = {
    resource: {
      timeMin,
      timeMax,
      items: [{ id }],
    },
  };
  calendar.freebusy.query(request, (err, res) => {
    if (err) return console.log(err.message);
    let intervals = res.data.calendars[id].busy;
    if (intervals.length) {
      console.log('Here is an array of busy intervals:');
      console.log(intervals);
    } else {
      console.log('There are no busy intervals');
    }
  });
}

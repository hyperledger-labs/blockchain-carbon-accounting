# Supply Chain Emissions Application

## Installing

Sign up for the [UPS Developer Kit](https://www.ups.com/upsdeveloperkit?loc=en_US) to get the access key.  

Copy `.env.SAMPLE` to `.env` and fill in your UPS username and password and access key in `.env`.

Sign up for the [Google DistanceMatrix API](https://developers.google.com/maps/documentation/distance-matrix/overview) and [Google Geocode API](https://developers.google.com/maps/documentation/geocoding/overview) and get an access key for both API's.

Fill in the Google API key in `.env`.

Install dependencies here and in `utility-emissions-channel/typescript_app` with

```
npm install
```

## Trying it

Run

```
node ups.js <tracking-number1> [tracking-number2] ...
```

with one or more UPS tracking numbers.

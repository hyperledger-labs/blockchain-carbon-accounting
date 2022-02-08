# Supply Chain Emissions Application

## Installing

Sign up for the [UPS Developer Kit](https://www.ups.com/upsdeveloperkit?loc=en_US) to get the access key.  

Copy `.env.SAMPLE` to `.env` and fill in your UPS username and password and access key in `.env`.

Install dependencies with

```
npm install
```

## Trying it

Run

```
node ups.js <tracking-number>
```

with a UPS tracking number.

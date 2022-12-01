# Voluntary Carbon Offsets Directory

This is an initial implementation of the [Voluntary Carbon Offsets Directory](https://wiki.hyperledger.org/display/CASIG/Voluntary+Carbon+Offsets+Directory+Research+Project) using a database.  

## Setup

### Init the Postgresql Database

Create a Postgres database as configured in `node-server/app/config/db.config.js` by default this should be `open-offsets-directory`.
Note: make sure that the date format is set to 'ISO, MDY' as this is exoected during the data import.

```
createdb open-offsets-directory
psql open-offsets-directory -c 'ALTER DATABASE "open-offsets-directory" SET datestyle TO "ISO, MDY";'
```

Then initialize the schema using `node-server/init-schema.sql`

```
psql open-offsets-directory < node-server/init-schema.sql
```

Import the projects data from the CSV sample file `data/projects.csv` (this data is from https://gspp.berkeley.edu/faculty-and-impact/centers/cepp/projects/berkeley-carbon-trading-project/offsets-database)

```
cat data/projects.csv | psql open-offsets-directory -c "$(cat node-server/import-csv.sql)"
```

Import the details of Issuances and Retirements:

```
cat data/ACR_issuances.csv | psql open-offsets-directory -c "$(cat node-server/import_csv_acr_issuances.sql)"
cat data/CAR_issuances.csv | psql open-offsets-directory -c "$(cat node-server/import_csv_car_issuances.sql)"
cat data/VCS_issuances.csv | psql open-offsets-directory -c "$(cat node-server/import_csv_vcs_issuances.sql)"
cat data/GOLD_issuances.csv | psql open-offsets-directory -c "$(cat node-server/import_csv_gold_issuances.sql)"
cat data/VCS_retirements.csv | psql open-offsets-directory -c "$(cat node-server/import_csv_vcs_retirements.sql)"
cat data/GOLD_retirements.csv | psql open-offsets-directory -c "$(cat node-server/import_csv_gold_retirements.sql)"
cat data/ACR_retirements.csv | psql open-offsets-directory -c "$(cat node-server/import_csv_acr_retirements.sql)"
cat data/CAR_retirements.csv | psql open-offsets-directory -c "$(cat node-server/import_csv_car_retirements.sql)"
```

Then
```
psql open-offsets-directory < node-server/import-issuances.sql
psql open-offsets-directory < node-server/import-retirements.sql
```


### Optional: setup Google ReCaptcha

Setup your site at https://www.google.com/recaptcha/ (use V3 and add your domains which can include `localhost` for testing) then add the Site Key and Secret into `node-server/.env` and `react/.env` in order to require
the reCaptcha verification for some requests like the projects search.

## Running the App

Install dependencies and start the API server:
```
cd node-server
npm install
npm start
```

Install dependencies and start the React App:
```
cd react
npm install
npm start
```

## Running in Production

Example of how to deploy this on an Apache server with Systemd:

### Frontend

Setup the React app config in `react/.env`, most importantly change `REACT_APP_API_URL` to point to the server eg: `https://www.example.com`, also set `REACT_APP_RECAPTCHA_SITE_KEY` if needed.

Build the React app:
```
cd react
npm install
npm run build
```

Setup your Apache virtual server, you `DocumentRoot` would be the React build directory.
```
<VirtualHost 1.2.3.4:443>
        ServerName www.example.com

        DocumentRoot "/path/to/react/build"
        DirectoryIndex index.html
        ServerAdmin webmaster@example.com
        ErrorLog /var/log/httpd/www.example.com/error_log
        CustomLog /var/log/httpd/www.example.com/access_log combined

        <Directory "/path/to/react/build/">
            AllowOverride All
            Order allow,deny
            Allow from all

            # For the React router: Don't rewrite files or directories like static assets
            RewriteEngine on
            RewriteCond %{REQUEST_FILENAME} -f [OR]
            RewriteCond %{REQUEST_FILENAME} -d
            RewriteRule ^ - [L]
            # Rewrite everything else to index.html to allow html5 state links
            RewriteRule ^ index.html [L]
        </Directory>

        # This should point to the Port the NodeJS backend runs at
        <Location /api/>
            ProxyPass http://localhost:3001/api/
            ProxyPassReverse http://localhost:3001/api/
        </Location>

        # Other SSL related config here ...

</VirtualHost>
```

Then run:
```
systemctl reload httpd
```

### Backend

Create a `/lib/systemd/system/open-offsets-directory-nodejs.service`

Note the port `3001` is specified here, must match the Apache `ProxyPass` and `ProxyPassReverse` above. The ReCaptcha setup is optional.

```
[Unit]
Description=The Open Offsets Directory NodeJS server
After=network.target

[Service]
Environment=RECAPTCHA_SITE_KEY=XXX
Environment=RECAPTCHA_SECRET=YYY
Environment=PORT=3001
Type=simple
User=opentaps
ExecStart=/path/to/bin/node /path/to/node-server/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then run:
```
systemctl daemon-reload
systemctl enable open-offsets-directory-nodejs
systemctl start open-offsets-directory-nodejs
```

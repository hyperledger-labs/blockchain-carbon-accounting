#!/bin/sh

npm run dataLoader load_emissions_factors conversion-factors-2021-flat-file-automatic-processing.xls "Factors by Category" -- --format conversion-factors-uk --year 2021
npm run dataLoader load_emissions_factors conversion-factors-2019-flat-file-v01-02.xls "Factors by Category" -- --format conversion-factors-uk --year 2019
npm run dataLoader load_emissions_factors Conversion_Factors_2020_-_Flat_file__for_automatic_processing_only_.xlsx "Factors by Category" -- --format conversion-factors-uk --year 2020
npm run dataLoader load_emissions_factors egrid2019_data.xlsx NRL19 -- --format egrid_data --source https://www.epa.gov/sites/production/files/2021-02/egrid2019_data.xlsx
npm run dataLoader load_emissions_factors egrid2019_data.xlsx ST19 -- --format egrid_data --source https://www.epa.gov/sites/production/files/2021-02/egrid2019_data.xlsx
npm run dataLoader load_emissions_factors egrid2019_data.xlsx US19 -- --format egrid_data --source https://www.epa.gov/sites/production/files/2021-02/egrid2019_data.xlsx
npm run dataLoader load_emissions_factors egrid2020_data.xlsx NRL20 -- --format egrid_data --source https://www.epa.gov/system/files/documents/2022-01/egrid2020_data.xlsx
npm run dataLoader load_emissions_factors egrid2020_data.xlsx ST20 -- --format egrid_data --source https://www.epa.gov/system/files/documents/2022-01/egrid2020_data.xlsx
npm run dataLoader load_emissions_factors egrid2020_data.xlsx US20 -- --format egrid_data --source https://www.epa.gov/system/files/documents/2022-01/egrid2020_data.xlsx
npm run dataLoader load_utility_identifiers Utility_Data_2019.xlsx
npm run dataLoader load_emissions_factors co2-emission-intensity-6.csv -- --format eea_intensity --source https://www.eea.europa.eu/data-and-maps/daviz/sds/co2-emission-intensity-from-electricity-generation
npm run dataLoader load_emissions_factors 2019-RES_proxies_EEA.csv -- --format eea_res_proxies --source https://www.eea.europa.eu/data-and-maps/data/approximated-estimates-for-the-share-4

psql blockchain-carbon-accounting < seeds/*


# Oil & Gas data

## sources

Original files can be downloaded directly from sources listed below using `download.sh` or from [google dive](https://drive.google.com/drive/folders/1Kifnuj4x2uhzm3oxS4nqh-OQszTuqlWU?usp=sharing) (*Not stored in the directory*)

To load data into postgres db (blockchain-carbon-accounting) run the following from `/data`.
```
sh loadOGdata.sh
```

### [US Oil & Gas Asset Data](https://hifld-geoplatform.opendata.arcgis.com/datasets/geoplatform::oil-and-natural-gas-wells/explore)

`./files/Oil_and_Natural_Gas_Wells.geojson`

[geojson](https://services1.arcgis.com/Hp6G80Pky0om7QvQ/arcgis/rest/services/Oil_and_Natural_Gas_Wells/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson)

*Can be downloaded from google drive*
*This file exceed 1.5 GB and will take time to write to postrges db*

### [CATF U.S. benchmarking reoprt](https://cdn.catf.us/wp-content/uploads/2022/07/14094726/oilandgas_benchmarkingreport2022.pdf)

- [Raw data files](https://www.sustainability.com/globalassets/sustainability.com/thinking/pdfs/2022/2022-og-benchmarking-report-data.xlsx)


### [EIA Crude Oil](https://www.eia.gov/dnav/pet/pet_crd_crpdn_adc_mbbl_m.htm)

- [US State level crude oil production (monthly)](https://www.eia.gov/dnav/ng/xls/PET_CRD_CRPDN_ADC_MBBL_M.xls)


### [EIA State level natural gas](https://www.eia.gov/dnav/ng/ng_prod_sum_a_EPG0_FGW_mmcf_m.htm)

- [Vented and Flared (monthly)](https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_VGV_MMCF_M.xls)

- [Marketed Production (monthly)](https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_VGM_MMCF_M.xls)

- [Repressuring (monthly)](https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_VGQ_MMCF_M.xls)

- [Natural Gas Plant Liquids (monthly)](https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_VG9_MMCF_M.xls)

- [Gross Withdrawls (monthly)](https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_FGW_MMCF_M.xls)


### VIIRS annual flaring data

*Can be downloaded from google drive. annual public eogdata requires free subscription...*

- [2021](https://eogdata.mines.edu/global_flare_data/VIIRS_Global_flaring_d.7_slope_0.029353_2021_web.xlsx)

- [2020](https://eogdata.mines.edu/global_flare_data/VIIRS_Global_flaring_d.7_slope_0.029353_2020_web_v1.xlsx)

- [2019](https://eogdata.mines.edu/global_flare_data/VIIRS_Global_flaring_d.7_slope_0.029353_2019_web_v20201114.xlsx)

- [2018](https://eogdata.mines.edu/global_flare_data/VIIRS_Global_flaring_d.7_slope_0.029353_2018_web.xlsx)

- [2017](https://eogdata.mines.edu/global_flare_data/VIIRS_Global_flaring_d.7_slope_0.029353_2017_web_v1.xlsx)

- [2012-2016](https://eogdata.mines.edu/global_flare_data/VIIRS_Global_flaring_d.7_slope_0.0298_2012-2016_web.xlsx)


### Flare Monitor (monthly)

- [Detailed](https://raw.githubusercontent.com/flaringmonitor/viirs-flare-data/main/processed/flaring_monitor_detailed_observations.csv)

- [Company Stats Satellite Modeled](https://raw.githubusercontent.com/flaringmonitor/viirs-flare-data/main/processed/flaring_monitor_company_stats_satellite_modeled.csv)

- [Company Stats Reported](https://raw.githubusercontent.com/flaringmonitor/viirs-flare-data/main/processed/flaring_monitor_company_stats_reported.csv)

- [Basin Stats](https://raw.githubusercontent.com/flaringmonitor/viirs-flare-data/main/processed/flaring_monitor_basin_stats.csv)


# Exmaple dateLoader scripts

See `../loadOGdata.sh` for all dataLoader scripts for oil and gas data.

## HIFLD oil and gas assets
```
npm run dataLoader load_og_assets "./oil_and_gas/files/Oil_and_Natural_Gas_Wells.geojson" -- --format US_asset_data --source "https://hifld-geoplatform.opendata.arcgis.com/datasets/geoplatform::oil-and-natural-gas-wells/explore"
```

## CATF U.S. Benchmarking
```
npm run dataLoader load_product_data "./oil_and_gas/files/2022-og-benchmarking-report-data.xlsx" "Company_basin" -- --format Benchmark --source "https://www.sustainability.com/globalassets/sustainability.com/thinking/pdfs/2022/2022-og-benchmarking-report-data.xlsx" --skip_rows 7
```

## VIIRS flaring data processed 
```
npm run dataLoader load_product_data "./oil_and_gas/files/VIIRS_Global_flaring_d.7_slope_0.029353_2021_web.xlsx" "flare upstream" -- --format VIIRS --year 2021 --source "https://eogdata.mines.edu/global_flare_data/VIIRS_Global_flaring_d.7_slope_0.029353_2021_web.xlsx"
```

## EIA Crude Oil
```
npm run dataLoader load_product_data "./oil_and_gas/files/PET_CRD_CRPDN_ADC_MBBL_M.xls" "Data 1" -- --format "EIA" --source "https://www.eia.gov/dnav/ng/xls/PET_CRD_CRPDN_ADC_MBBL_M.xls" --name "Crude Oil" --type "Field Production" --unit "Thousand Barrels" --skip_rows 2
```

## EIA Natural Gas

### Marketed Production
```
npm run dataLoader load_product_data "./oil_and_gas/files/NG_PROD_SUM_A_EPG0_VGM_MMCF_M.xls" "Data 1" -- --format "EIA" --source "https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_VGM_MMCF_M.xls" --name "Natural Gas" --type "Marketed Production" --unit "MMcf" --skip_rows 2
```
```
npm run dataLoader load_product_data "./oil_and_gas/files/NG_PROD_SUM_A_EPG0_VGM_MMCF_M.xls" "Data 2" -- --format "EIA" --source "https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_VGM_MMCF_M.xls" --name "Natural Gas" --type "Marketed Production" --unit "MMcf" --skip_rows 2
```
### Vented and Flared
```
npm run dataLoader load_product_data "./oil_and_gas/files/NG_PROD_SUM_A_EPG0_VGV_MMCF_M.xls" "Data 1" -- --format "EIA" --source "https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_VGV_MMCF_M.xls" --name "Natural Gas" --type "Vented and Flared" --unit "MMcf" --skip_rows 2
```
```
npm run dataLoader load_product_data "./oil_and_gas/files/NG_PROD_SUM_A_EPG0_VGV_MMCF_M.xls" "Data 2" -- --format "EIA" --source "https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_VGV_MMCF_M.xls" --name "Natural Gas" --type "Vented and Flared" --unit "MMcf" --skip_rows 2
```
### Repressuring
```
npm run dataLoader load_product_data "./oil_and_gas/files/NG_PROD_SUM_A_EPG0_VGQ_MMCF_M.xls" "Data 1" -- --format "EIA" --source "https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_VGQ_MMCF_M.xls" --name "Natural Gas" --type "Repressuring" --unit "MMcf" --skip_rows 2
```
```
npm run dataLoader load_product_data "./oil_and_gas/files/NG_PROD_SUM_A_EPG0_VGQ_MMCF_M.xls" "Data 2" -- --format "EIA" --source "https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_VGQ_MMCF_M.xls" --name "Natural Gas" --type "Repressuring" --unit "MMcf" --skip_rows 2
```
### NGPL Production
```
npm run dataLoader load_product_data "./oil_and_gas/files/NG_PROD_SUM_A_EPG0_VG9_MMCF_M.xls" "Data 1" -- --format "EIA" --source "https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_VG9_MMCF_M.xls" --name "Natural Gas Plant Liquids" --type "Production" --unit "Million Cubic Feet" --skip_rows 2
```
```
npm run dataLoader load_product_data "./oil_and_gas/files/NG_PROD_SUM_A_EPG0_VG9_MMCF_M.xls" "Data 2" -- --format "EIA" --source "https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_VG9_MMCF_M.xls" --name "Natural Gas Plant Liquids" --type "Production" --unit "Million Cubic Feet" --skip_rows 2
```
### Gross Withdrawls
```
npm run dataLoader load_product_data "./oil_and_gas/files/NG_PROD_SUM_A_EPG0_FGW_MMCF_M.xls" "Data 1" -- --format "EIA" --source "https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_FGW_MMCF_M.xls" --name "Natural Gas" --type "Gross Withdrawals" --unit "MMcf" --skip_rows 2
```
```
npm run dataLoader load_product_data "./oil_and_gas/files/NG_PROD_SUM_A_EPG0_FGW_MMCF_M.xls" "Data 2" -- --format "EIA" --source "https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_FGW_MMCF_M.xls" --name "Natural Gas" --type "Gross Withdrawals" --unit "MMcf" --skip_rows 2
```

## Flaring Monitor
```
npm run dataLoader load_product_data "./oil_and_gas/files/flaring_monitor_detailed_observations.csv" "Sheet1" -- --format "FlareMonitor" --source "https://raw.githubusercontent.com/flaringmonitor/viirs-flare-data/main/processed/flaring_monitor_detailed_observations.csv" --name "Methane" --type "Flaring" --unit "MMcf"
```
```
npm run dataLoader load_product_data "./oil_and_gas/files/flaring_monitor_company_stats_satellite_modeled.csv" "Sheet1" -- --format "FlareMonitor" --source "https://raw.githubusercontent.com/flaringmonitor/viirs-flare-data/main/processed/flaring_monitor_company_stats_satellite_modeled.csv"
```
```
npm run dataLoader load_product_data "./oil_and_gas/files/flaring_monitor_company_stats_reported.csv" "Sheet1" -- --format "FlareMonitor" --source "https://raw.githubusercontent.com/flaringmonitor/viirs-flare-data/main/processed/flaring_monitor_company_stats_reported.csv"
```
```
npm run dataLoader load_product_data "./oil_and_gas/files/flaring_monitor_basin_stats.csv" "Sheet1" -- --format "FlareMonitor" --source "https://raw.githubusercontent.com/flaringmonitor/viirs-flare-data/main/processed/flaring_monitor_basin_stats.csv"
```
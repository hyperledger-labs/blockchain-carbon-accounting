mkdir files;
cd files;

echo "Downloading HIFLD oil and gas asset data from google drive..."
fileId=1TALGFUVab2FfANDMLmd1QLfCDAIK-7Mo
fileName=Oil_and_Natural_Gas_Wells.geojson
curl -L -c cookies.txt 'https://docs.google.com/uc?export=download&id='$fileId \
     | sed -rn 's/.*confirm=([0-9A-Za-z_]+).*/\1/p' > confirm.txt
curl -L -b cookies.txt -o $fileName \
     'https://docs.google.com/uc?export=download&id='$fileId'&confirm='$(<confirm.txt)
rm -f confirm.txt cookies.txt

echo "Downloading oil and gas product data from google drive..."
echo "VIIRS flaring data..."
curl \
-L -o 'VIIRS_Global_flaring_d.7_slope_0.029353_2021_web.xlsx' 'https://docs.google.com/uc?export=download&id=12uYU73IWiGmyZ3L4LrN98NjfsumcY-TM' \
-L -o 'VIIRS_Global_flaring_d.7_slope_0.029353_2020_web_v1.xlsx' 'https://docs.google.com/uc?export=download&id=1hvds6gXbikZ5xSXLzXM1IIunSzOj8pTY' \
-L -o 'VIIRS_Global_flaring_d.7_slope_0.029353_2019_web_v20201114.xlsx' 'https://docs.google.com/uc?export=download&id=1EeeewbuDwO51UvJz7YYzWj12b2VQY2FU' \
-L -o 'VIIRS_Global_flaring_d.7_slope_0.029353_2018_web.xlsx' 'https://docs.google.com/uc?export=download&id=1u7Jtvd3wo6h9rwRa4mhTToxugL8cC1zZ' \
-L -o 'VIIRS_Global_flaring_d.7_slope_0.029353_2017_web_v1.xlsx' 'https://docs.google.com/uc?export=download&id=1PvqIrdqIAfhrMXml8kfqqcqyMihuFLqx' \
-L -o 'VIIRS_Global_flaring_d.7_slope_0.0298_2012-2016_web.xlsx' 'https://docs.google.com/uc?export=download&id=1xi2Gkjl7uo4W4VXzrMFu8E7965RBry7m'
echo "EIA data..."
curl \
-O https://www.eia.gov/dnav/ng/xls/PET_CRD_CRPDN_ADC_MBBL_M.xls \
-O https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_VGV_MMCF_M.xls \
-O https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_VGM_MMCF_M.xls \
-O https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_VGQ_MMCF_M.xls \
-O https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_VG9_MMCF_M.xls \
-O https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_FGW_MMCF_M.xls
echo "Flaring monitor data..."
curl \
-O https://raw.githubusercontent.com/flaringmonitor/viirs-flare-data/main/processed/flaring_monitor_detailed_observations.csv \
-O https://raw.githubusercontent.com/flaringmonitor/viirs-flare-data/main/processed/flaring_monitor_company_stats_satellite_modeled.csv \
-O https://raw.githubusercontent.com/flaringmonitor/viirs-flare-data/main/processed/flaring_monitor_company_stats_reported.csv \
-O https://raw.githubusercontent.com/flaringmonitor/viirs-flare-data/main/processed/flaring_monitor_basin_stats.csv 
echo "Oil and gas benchmarking study (CATF)..."
curl \
-O https://www.sustainability.com/globalassets/sustainability.com/thinking/pdfs/2022/2022-og-benchmarking-report-data.xlsx

# eogdata requires subscription. Cannot be downloaded ... instead these have been saved to google drive and downlaoded with curl above.
#-O https://eogdata.mines.edu/global_flare_data/VIIRS_Global_flaring_d.7_slope_0.029353_2021_web.xlsx \
#-O https://eogdata.mines.edu/global_flare_data/VIIRS_Global_flaring_d.7_slope_0.029353_2020_web_v1.xlsx \
#-O https://eogdata.mines.edu/global_flare_data/VIIRS_Global_flaring_d.7_slope_0.029353_2019_web_v20201114.xlsx \
#-O https://eogdata.mines.edu/global_flare_data/VIIRS_Global_flaring_d.7_slope_0.029353_2018_web.xlsx \
#-O https://eogdata.mines.edu/global_flare_data/VIIRS_Global_flaring_d.7_slope_0.029353_2017_web_v1.xlsx \
#-O https://eogdata.mines.edu/global_flare_data/VIIRS_Global_flaring_d.7_slope_0.0298_2012-2016_web.xlsx \
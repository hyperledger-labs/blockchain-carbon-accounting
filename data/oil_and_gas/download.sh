mkdir files;
cd files;
curl -O https://www.eia.gov/dnav/ng/xls/PET_CRD_CRPDN_ADC_MBBL_M.xls \
-O https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_VGV_MMCF_M.xls \
-O https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_VGM_MMCF_M.xls \
-O https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_VGQ_MMCF_M.xls \
-O https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_VG9_MMCF_M.xls \
-O https://www.eia.gov/dnav/ng/xls/NG_PROD_SUM_A_EPG0_FGW_MMCF_M.xls \
-O https://raw.githubusercontent.com/flaringmonitor/viirs-flare-data/main/processed/flaring_monitor_detailed_observations.csv \
-O https://raw.githubusercontent.com/flaringmonitor/viirs-flare-data/main/processed/flaring_monitor_company_stats_satellite_modeled.csv \
-O https://raw.githubusercontent.com/flaringmonitor/viirs-flare-data/main/processed/flaring_monitor_company_stats_reported.csv \
-O https://raw.githubusercontent.com/flaringmonitor/viirs-flare-data/main/processed/flaring_monitor_basin_stats.csv \
-O https://www.sustainability.com/globalassets/sustainability.com/thinking/pdfs/2022/2022-og-benchmarking-report-data.xlsx

# eogdata requires subscription. Cannot be downloaded ...
#-O https://eogdata.mines.edu/global_flare_data/VIIRS_Global_flaring_d.7_slope_0.029353_2021_web.xlsx \
#-O https://eogdata.mines.edu/global_flare_data/VIIRS_Global_flaring_d.7_slope_0.029353_2020_web_v1.xlsx \
#-O https://eogdata.mines.edu/global_flare_data/VIIRS_Global_flaring_d.7_slope_0.029353_2019_web_v20201114.xlsx \
#-O https://eogdata.mines.edu/global_flare_data/VIIRS_Global_flaring_d.7_slope_0.029353_2018_web.xlsx \
#-O https://eogdata.mines.edu/global_flare_data/VIIRS_Global_flaring_d.7_slope_0.029353_2017_web_v1.xlsx \
#-O https://eogdata.mines.edu/global_flare_data/VIIRS_Global_flaring_d.7_slope_0.0298_2012-2016_web.xlsx \
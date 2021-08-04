-- cleanup previous data ?
delete from issuance;

-- remove the VCS prefix from project IDs
update csv_acr_issuances set project_id = regexp_replace(project_id, E'^VCS', '');
update csv_car_issuances set project_id = regexp_replace(project_id, E'^VCS', '');
update csv_vcs_issuances set project_id = regexp_replace(project_id, E'^VCS', '');
update csv_gold_issuances set project_id = regexp_replace(project_id, E'^VCS', '');

-- Note most of the date issued are integers as number of days since Jan 1 1900
-- use: TO_DATE('19000101','YYYYMMDD') + interval '1 day' * date_issued

-- csv_acr_issuances
insert into issuance (
    id,
    project_id,
    project_registry_id,
    vintage_year,
    issuance_date,
    quantity_issued,
    serial_number
) select
    uuid_generate_v4(),
    p.project_id,
    p.id,
    i.vintage,
    TO_DATE('19000101','YYYYMMDD') + interval '1 day' * i.date_issued,
    i.total_credits_issued,
    ''
from csv_acr_issuances i
join project_registry p on i.project_id = p.registry_project_id;

-- csv_car_issuances
insert into issuance (
    id,
    project_id,
    project_registry_id,
    vintage_year,
    issuance_date,
    quantity_issued,
    serial_number
) select
    uuid_generate_v4(),
    p.project_id,
    p.id,
    i.vintage,
    TO_DATE('19000101','YYYYMMDD') + interval '1 day' * i.date_issued,
    i.total_offset_credits_issued,
    ''
from csv_car_issuances i
join project_registry p on i.project_id = p.registry_project_id;

-- csv_vcs_issuances
insert into issuance (
    id,
    project_id,
    project_registry_id,
    vintage_year,
    issuance_date,
    quantity_issued,
    serial_number
) select
    uuid_generate_v4(),
    p.project_id,
    p.id,
    i.vintage_year,
    i.issuance_date,
    i.credits_issued,
    ''
from csv_vcs_issuances i
join project_registry p on i.project_id = p.registry_project_id;

-- csv_gold_issuances
insert into issuance (
    id,
    project_id,
    project_registry_id,
    vintage_year,
    issuance_date,
    quantity_issued,
    serial_number
) select
    uuid_generate_v4(),
    p.project_id,
    p.id,
    i.vintage,
    i.issuance_date,
    i.quantity,
    i.serial_number
from csv_gold_issuances i
join project_registry p on i.project_id = p.registry_project_id
where i.credit_status = 'Issued';

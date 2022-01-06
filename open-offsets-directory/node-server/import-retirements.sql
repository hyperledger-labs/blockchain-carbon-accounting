-- cleanup previous data ?
delete from retirement;

-- remove the VCS prefix from project IDs
update csv_acr_retirements set project_id = regexp_replace(project_id, E'^VCS', '');
update csv_car_retirements set project_id = regexp_replace(project_id, E'^VCS', '');
update csv_vcs_retirements set project_id = regexp_replace(project_id, E'^VCS', '');
update csv_gold_retirements set gsid = regexp_replace(gsid, E'^VCS', '');

-- csv_acr_retirements
insert into retirement (
    id,
    project_id,
    project_registry_id,
    vintage_year,
    retirement_date,
    quantity_retired,
    serial_number,
    retirement_beneficiary,
    retirement_reason,
    retirement_detail
) select
    uuid_generate_v4(),
    p.project_id,
    p.id,
    i.vintage,
    i.status_effective,
    i.quantity_of_offset_credits,
    i.offset_credit_serial_numbers,
    i.account_holder,
    i.retirement_reason,
    i.retirement_reason_details
from csv_acr_retirements i
join project_registry p on i.project_id = p.registry_project_id;

-- csv_car_retirements
insert into retirement (
    id,
    project_id,
    project_registry_id,
    vintage_year,
    retirement_date,
    quantity_retired,
    serial_number,
    retirement_beneficiary,
    retirement_reason,
    retirement_detail
) select
    uuid_generate_v4(),
    p.project_id,
    p.id,
    i.vintage,
    i.status_effective,
    i.quantity_of_offset_credits,
    i.offset_credit_serial_numbers,
    i.account_holder,
    i.retirement_reason,
    i.retirement_reason_details
from csv_car_retirements i
join project_registry p on i.project_id = p.registry_project_id;

-- csv_vcs_retirements
insert into retirement (
    id,
    project_id,
    project_registry_id,
    vintage_year,
    retirement_date,
    quantity_retired,
    serial_number,
    retirement_beneficiary,
    retirement_reason,
    retirement_detail
) select
    uuid_generate_v4(),
    p.project_id,
    p.id,
    i.vintage_year,
    i.retirement_cancellation_date,
    i.credits_retired,
    i.serial_number,
    i.retirement_beneficiary,
    i.retirement_reason,
    i.retirement_details
from csv_vcs_retirements i
join project_registry p on i.project_id = p.registry_project_id;

-- csv_gold_retirements
insert into retirement (
    id,
    project_id,
    project_registry_id,
    vintage_year,
    retirement_date,
    quantity_retired,
    serial_number,
    retirement_beneficiary,
    retirement_reason,
    retirement_detail
) select
    uuid_generate_v4(),
    p.project_id,
    p.id,
    i.vintage,
    i.retirement_date,
    i.quantity,
    i.serial_number,
    '',
    '',
    i.notes
from csv_gold_retirements i
join project_registry p on i.gsid = p.registry_project_id
where i.credit_status = 'Retired';

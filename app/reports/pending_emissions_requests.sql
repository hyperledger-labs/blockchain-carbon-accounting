select tmp.emission_auditor, wl.name, tmp.cn from (
select emission_auditor, count(*) as cn from emissions_request er 
where status = 'PENDING'
group by emission_auditor 
) tmp
left outer join wallet wl on tmp.emission_auditor = wl.address
order by wl.name
;


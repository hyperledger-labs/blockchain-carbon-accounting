INSERT INTO activity_emissions_factor_lookup
(mode, type, scope, level_1, level_2, level_3, level_4, text, activity_uom)
VALUES
('flight', 'economy', 'Scope 3', 'Business travel- air', 'Flights', 'Long-haul, to/from UK', 'Economy class', 'With RF', 'passenger.km');
INSERT INTO activity_emissions_factor_lookup
(mode, type, scope, level_1, level_2, level_3, level_4, text, activity_uom)
VALUES
('flight', 'premium economy', 'Scope 3', 'Business travel- air', 'Flights', 'Long-haul, to/from UK', 'Premium economy class', 'With RF', 'passenger.km');
INSERT INTO activity_emissions_factor_lookup
(mode, type, scope, level_1, level_2, level_3, level_4, text, activity_uom)
VALUES
('flight', 'business', 'Scope 3', 'Business travel- air', 'Flights', 'Long-haul, to/from UK', 'Business class', 'With RF', 'passenger.km');
INSERT INTO activity_emissions_factor_lookup
(mode, type, scope, level_1, level_2, level_3, level_4, text, activity_uom)
VALUES
('flight', 'first', 'Scope 3', 'Business travel- air', 'Flights', 'Long-haul, to/from UK', 'First class', 'With RF', 'passenger.km');

INSERT INTO activity_emissions_factor_lookup
(mode, type, scope, level_1, level_2, level_3, level_4, text, activity_uom)
VALUES
('carrier', 'sea', 'Scope 3', 'Freighting goods', 'Cargo ship', 'Container ship', 'Average', '', 'tonne.km');
INSERT INTO activity_emissions_factor_lookup
(mode, type, scope, level_1, level_2, level_3, level_4, text, activity_uom)
VALUES
('carrier', 'ground', 'Scope 3', 'Freighting goods', 'Vans', 'Class III (1.74 to 3.5 tonnes)', '', 'Diesel', 'tonne.km');
INSERT INTO activity_emissions_factor_lookup
(mode, type, scope, level_1, level_2, level_3, level_4, text, activity_uom)
VALUES
('carrier', 'air', 'Scope 3', 'Freighting goods', 'Freight flights', 'Long-haul, to/from UK', '', 'With RF', 'tonne.km');
INSERT INTO activity_emissions_factor_lookup
(mode, type, scope, level_1, level_2, level_3, level_4, text, activity_uom)
VALUES
('carrier', 'ups ground', 'Scope 3', 'Freighting goods', 'Vans', 'Class III (1.74 to 3.5 tonnes)', '', 'Diesel', 'tonne.km');
INSERT INTO activity_emissions_factor_lookup
(mode, type, scope, level_1, level_2, level_3, level_4, text, activity_uom)
VALUES
('carrier', 'ups air', 'Scope 3', 'Freighting goods', 'Freight flights', 'Long-haul, to/from UK', '', 'With RF', 'tonne.km');

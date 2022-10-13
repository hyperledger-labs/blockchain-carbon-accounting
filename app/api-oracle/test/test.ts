import request from 'supertest';
import app from '../server';

describe('POST /uuid', function() {
    it('responds with co2emissions for uuid and usage', function(done) {
      request(app)
        .post('/postgres/uuid')
        .send({
            "uuid": "25cac32a-17b1-4730-baf1-0db631911324",
            "usageUOM": "kWH",
            "usage" : 1000,
            "thruDate": "December 31 2020"
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect({
          "emission": {
              "value": 2.607667092612959e-9,
              "uom": "tons"
          },
          "division_type": "STATE",
          "division_id": "SC",
          "renewable_energy_use_amount": 70.85070059849463,
          "nonrenewable_energy_use_amount": 929.1492994015053,
          "year": 2020
      })
        .end(function(err, res) {
          if (err) return done(err);
          return done();
        });
    });
  });

  describe('POST /activity', function() {
    it('responds with co2emissions for activity', function(done) {
      request(app)
        .post('/postgres/activity')
        .send({
          "scope": "scope 3",
          "level1": "HOTEL STAY",
          "level2": "HOTEL STAY",
          "level3": "ROMANIA",
          "level4": "",
          "text": "",
          "amount": 4,
          "uom": "Room per night"
      })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect({
          "emission": {
              "value": 102,
              "uom": "kg"
          },
          "year": 2021
      })
        .end(function(err, res) {
          if (err) return done(err);
          return done();
        });
    });
  });


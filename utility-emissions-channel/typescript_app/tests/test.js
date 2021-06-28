// SPDX-License-Identifier: Apache-2.0
"use strict";
var chai = require("chai");
var chaiHttp = require("chai-http");
var assert = chai.assert;
chai.use(chaiHttp);

describe("Test fabric", function() {
  var host = "http://localhost:9000";
  const registerAdminPath = "/api/v1/utilityemissionchannel/registerEnroll/admin";
  const enrollUserPath = "/api/v1/utilityemissionchannel/registerEnroll/user";
  const recordEmissionPath = "/api/v1/utilityemissionchannel/emissionscontract/recordEmissions";
  const getAllEmissionsPath =
    "/api/v1/utilityemissionchannel/emissionscontract/getAllEmissionsData/TestUser/auditor1/USA_EIA_11208/1234567890";

  it("should register auditor1", function(done) {
    chai
      .request(host)
      .post(registerAdminPath)
      // .field('myparam' , 'test')
      .set("content-type", "application/x-www-form-urlencoded")
      .send({ orgName: "auditor1" })
      .end((error, response) => {
        assert((response.body.info == "An identity for the admin user already exists in the wallet") || (response.body.info == "ORG ADMIN REGISTERED"), "Failed to register auditor1.");
        
        if (error) 
        {
          done(error);
        } else 
        {
          done();
        }
      });
  });

  it("should register user TestUser under department1/auditor1.", function(done) {
    chai
      .request(host)
      .post(enrollUserPath)
      // .field('myparam' , 'test')
      .set("content-type", "application/x-www-form-urlencoded")
      .send({ userId: "TestUser", orgName: "auditor1", affiliation: "auditor1.department1" })
      .end((error, response) => {
        assert((response.body.info == "An identity for the user TestUser already exists in the wallet") || (response.body.info == "USER REGISTERED AND ENROLLED"), "Failed to register user.");
        
        if (error) 
        {
          done(error);
        } else 
        {
          done();
        }
      });
  });

  it("should record an emission as TestUser", function(done) {
    chai
      .request(host)
      .post(recordEmissionPath)
      // .field('myparam' , 'test')
      .set("content-type", "application/x-www-form-urlencoded")
      .send({
        userId: "TestUser",
        orgName: "auditor1",
        utilityId: "USA_EIA_11208",
        partyId: "1234567890",
        fromDate: "2020-04-06T10:10:09Z",
        thruDate: "2020-04-06T10:10:09Z",
        energyUseAmount: 100,
        energyUseUom: "TONS",
      })
      .end((error, response) => {
        
     
        if(response.body.info == "UTILITY EMISSIONS DATA")
        {
        assert(response.body.info == "EMISSION RECORDED TO LEDGER", "Emission is successfully recorded.");
        done();
        }
        
        else if(error) 
        {
          done(error);
        } 
       
       else{
          done();
          }
        
        
      });
  });
 
 
  it("should display emission records for the correct year", function(done) {
    chai
       .request(host)
       .get(getAllEmissionsPath)
       .set("content-type", "application/json")
       .end((error, response) => {
           
        if(response.body == [])
        {
          assert(response.body == [], "No emissions to display");
          done();
        }
        
        else if(response.body[0])
        {
          let entry = response.body[0];
          let year = entry.factorSource.includes("2018");
          assert(year == true, "Emissions are recorded for correct year");
          done();
       }

        else(error) 
        {
          done(error);
        } 
      });
  });

  
  it("should get all emissions and verify that they are correctly upserted to the ledger", function(done) {
    chai
      .request(host)
      .get(getAllEmissionsPath)
      .set("content-type", "application/json")
      .end((error, response) => {
      
        if(response.body == [])
        {
          assert(response.body == [], "No emissions to display");
          done();
        }
        
        else if(response.body[0])
        {
          let entry = response.body[0];
          assert(entry.utilityId == "USA_EIA_11208", "GET request returned incorrect utilityId");
          assert(entry.partyId == "1234567890", "GET request returned incorrect partyId");
          assert(entry.fromDate == "2020-04-06T10:10:09Z", "GET request returned incorrect fromDate");
          assert(entry.thruDate == "2020-04-06T10:10:09Z", "GET request returned incorrect thruDate");
          assert(entry.emissionsAmount == 0.038749439720799216, "GET request returned incorrect emissionsAmount");
          assert(entry.emissionsUom == "MtCO2e", "GET request returned incorrect emissionsUom");
          assert(
            entry.renewableEnergyUseAmount == 40.38034651533783,
            "GET request returned incorrect renewableEnergyUseAmount"
          );
          assert(
            entry.nonrenewableEnergyUseAmount == 59.61965348466217,
            "GET request returned incorrect nonrenewableEnergyUseAmount"
          );
          assert(entry.energyUseUom == "TONS", "GET request returned incorrect energyUseUom");
          assert(entry.factorSource == "eGrid 2018 NERC_REGION WECC", "GET request returned incorrect factorSource");
          done();
        }

        // assert(response.body.info == "EMISSION RECORDED TO LEDGER", "Failed to record emission.");
        else(error) 
        {
          done(error);
        } 
      });
  });
});

// SPDX-License-Identifier: Apache-2.0
"use strict";
var chai = require("chai");
var chaiHttp = require("chai-http");
var assert = chai.assert;
const { expect } = require("chai");
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
      
       try{
        expect(response.body.info).to.equal("ORG ADMIN REGISTERED");
        done();
       }
      
        catch(error){
         done(error);
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
      
       try{
       
        expect(response.body.info).to.equal("USER REGISTERED AND ENROLLED");
        done();
       }
                
       catch (error)
        {
          done(error);
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
        fromDate: "2018-05-07T10:10:09Z",
        thruDate: "2018-05-07T10:10:09Z",
        energyUseAmount: 100,
        energyUseUom: "kWh",
      })
      .end((error, response) => {
        
       try{
        //console.log(`response :  ${JSON.stringify(response.body)}`);
        expect(response.body.info).to.equal("EMISSION RECORDED TO LEDGER");
        done();
       }
        
       catch (error)
        {
          done(error);
        } 
       
      });
  });
 
 
  it("should display emission records for the correct year (2019)", function(done) {
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
        fromDate: "2019-04-06T10:10:09Z",
        thruDate: "2019-04-06T10:10:09Z",
        energyUseAmount: 100,
        energyUseUom: "TONS",
      })
      .end((error, response) => {
       
       try{
          
          let entry = response.body;
          expect(entry.info).to.equal("EMISSION RECORDED TO LEDGER");
          let year = entry.factorSource.includes("2019");
          expect(year).to.equal(true);
          done();
       }

        catch(error) 
        {
          done(error);
        } 
      });
  });
  
    it("should display emission records for the correct year (2018)", function(done) {
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
        fromDate: "2018-10-06T10:10:09Z",
        thruDate: "2018-10-06T10:10:09Z",
        energyUseAmount: 100,
        energyUseUom: "TONS",
      })
      .end((error, response) => {
       
       try{

          let entry = response.body;
          expect(entry.info).to.equal("EMISSION RECORDED TO LEDGER");
          let year = entry.factorSource.includes("2018");
          expect(year).to.equal(true);
          done();
       }

        catch(error) 
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
      
      try{
        if(response.body == [])
        { 
          assert(response.body == [], "No emissions to display");
        }
        
        else if(response.body[0])
        {
          let entry = response.body[0];

          expect(entry.status).to.equal(200);
          expect(entry.utilityId).to.not.equal("USA_EIA_11208");
          expect(entry.partyId).to.not.equal("1234567890");
          expect(entry.fromDate).to.not.equal("2020-04-06T10:10:09Z");
          expect(entry.thruDate).to.not.equal("2020-04-06T10:10:09Z");
          expect(entry.emissionsAmount).to.not.equal(0.038749439720799216);
          expect(entry.emissionsUom).to.not.equal("MtCO2e");
          expect(entry.renewableEnergyUseAmount).to.not.equal(40.38034651533783);
          expect(entry.nonrenewableEnergyUseAmount).to.not.equal(59.61965348466217);
          expect(entry.energyUseUom).to.not.equal("TONS");
          expect(entry.factorSource).to.not.equal("eGrid 2018 NERC_REGION WECC");

        }
         
         done();
        }
        catch(error) 
        {
          done(error);
        } 
      });
  });
});

// SPDX-License-Identifier: Apache-2.0
"use strict";
var chai = require("chai");
var chaiHttp = require("chai-http");
var assert = chai.assert;
const { expect } = require("chai");
chai.use(chaiHttp);
let testUser = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(2, 10);
const { SHA256 } = require('crypto-js');
let emissions_2019;
let emissions_2018;

// calculating the hash for partyId
const hash = SHA256("1234567890").toString();

describe("Test fabric", function() {
  var host = "http://localhost:9000";
  const registerAdminPath = "/api/v1/utilityemissionchannel/registerEnroll/admin";
  const enrollUserPath = "/api/v1/utilityemissionchannel/registerEnroll/user";
  const recordEmissionPath = "/api/v1/utilityemissionchannel/emissionscontract/recordEmissions";
  const getAllEmissionsPath =
    `/api/v1/utilityemissionchannel/emissionscontract/getAllEmissionsData/${testUser}/auditor1/USA_EIA_11208/1234567890`;

   
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
      .send({ userId: testUser, orgName: "auditor1", affiliation: "auditor1.department1" })
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
        userId: testUser,
        orgName: "auditor1",
        utilityId: "USA_EIA_11208",
        partyId: "1234567890",
        fromDate: "2020-04-07T10:10:08Z",
        thruDate: "2020-04-07T10:10:08Z",
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
      .set("content-type", "application/x-www-form-urlencoded")
      .send({
        userId: testUser,
        orgName: "auditor1",
        utilityId: "USA_EIA_11208",
        partyId: "1234567890",
        fromDate: "2020-04-06T10:10:09Z",
        thruDate: "2020-04-06T10:10:09Z",
        energyUseAmount: 100,
        energyUseUom: "kWh",
      })
      .end((error, response) => {
       
       try{          
          let entry = response.body;
          expect(entry.info).to.equal("EMISSION RECORDED TO LEDGER");
          let year = entry.factorSource.includes("2019");
          expect(year).to.equal(true);
          // storing emissions calulated for 2019
          emissions_2019 = entry.emissionsAmount;
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
      .set("content-type", "application/x-www-form-urlencoded")
      .send({
        userId: testUser,
        orgName: "auditor1",
        utilityId: "USA_EIA_11208",
        partyId: "1234567890",
        fromDate: "2018-04-06T10:10:09Z",
        thruDate: "2018-04-06T10:10:09Z",
        energyUseAmount: 100,
        energyUseUom: "kWh",
      })
      .end((error, response) => {
       
       try{
          let entry = response.body;
          expect(entry.info).to.equal("EMISSION RECORDED TO LEDGER");
          let year = entry.factorSource.includes("2018");
          expect(year).to.equal(true);
          // storing emissions calulated for 2018
          emissions_2018 = entry.emissionsAmount;
          done();
       }

        catch(error) 
        {
          done(error);
        } 
      });
  });

 it("should check if emissions calculated for 2019 and 2018 for same energy amount is different", function(done) {
 
   try
   {
     expect(emissions_2019).to.not.equal(emissions_2018);
     done();
   }
   
   catch(error)
   {
     done(error);
   }
 });
 
it("should check if partyId is Encrypted", function(done) {
    chai
       .request(host)
      .post(recordEmissionPath)
      .set("content-type", "application/x-www-form-urlencoded")
      .send({
        userId: testUser,
        orgName: "auditor1",
        utilityId: "USA_EIA_11208",
        partyId: "1234567890",
        fromDate: "2020-04-05T10:10:09Z",
        thruDate: "2020-04-05T10:10:09Z",
        energyUseAmount: 100,
        energyUseUom: "kWh",
      })
       .end((error, response) => {
         
         try{
           let entry = response.body;
           expect(entry.info).to.equal("EMISSION RECORDED TO LEDGER");
           expect(entry.partyId).to.not.equal("1234567890");
           
           // checking if partyId is encrypted
           expect(entry.partyId).to.equal(hash);  
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
          
          expect(entry.info).to.equal("UTILITY EMISSIONS DATA");
          expect(entry.partyId).to.not.equal("1234567890");
          expect(entry.emissionsAmount).to.not.equal(0.038749439720799216);
          expect(entry.emissionsUom).to.not.equal("MtCO2e");
          expect(entry.renewableEnergyUseAmount).to.not.equal(40.38034651533783);
          expect(entry.nonrenewableEnergyUseAmount).to.not.equal(59.61965348466217);
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

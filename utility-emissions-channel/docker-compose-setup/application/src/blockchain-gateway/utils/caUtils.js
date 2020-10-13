/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const adminUserId = 'admin';
const adminUserPasswd = 'adminpw';

/**
 *
 * @param {*} FabricCAServices
 * @param {*} ccp
 */
exports.buildCAClient = (FabricCAServices, ccp, caHostName) => {
	// Create a new CA client for interacting with the CA.
	const caInfo = ccp.certificateAuthorities[caHostName]; //lookup CA details from config
	const caTLSCACerts = caInfo.tlsCACerts.pem;
	const caClient = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

	console.log(`Built a CA Client named ${caInfo.caName}`);
	return caClient;
};

exports.enrollAdmin = async (caClient, wallet, orgMspId) => {
	try { 
		let response = "";
		// Check to see if we've already enrolled the admin user.
		const identity = await wallet.get(adminUserId);
		if (identity) {
			response = 'An identity for the admin user already exists in the wallet';
			return response;
		}

		// Enroll the admin user, and import the new identity into the wallet.
		const enrollment = await caClient.enroll({ enrollmentID: adminUserId, enrollmentSecret: adminUserPasswd });
		const x509Identity = {
			credentials: {
				certificate: enrollment.certificate,
				privateKey: enrollment.key.toBytes(),
			},
			mspId: orgMspId,
			type: 'X.509',
		};
		await wallet.put(adminUserId, x509Identity);
		response = 'Successfully enrolled admin user and imported it into the wallet'
		return response
	} catch (error) {
		let response = ""
		response = `Failed to enroll admin user : ${error}`;
		console.error(response);
		return response;
	}
};

exports.registerAndEnrollUser = async (caClient, wallet, orgMspId, userId, affiliation) => {
	try {
		let response = "";
		// Check to see if we've already enrolled the user
		const userIdentity = await wallet.get(userId);
		if (userIdentity) {
			response = `An identity for the user ${userId} already exists in the wallet`;
			return response;
		}

		// Must use an admin to register a new user
		const adminIdentity = await wallet.get(adminUserId);
		if (!adminIdentity) {
			response = 'An identity for the admin user does not exist in the wallet. Enroll the admin user before retrying'
			return response;
		}

		// build a user object for authenticating with the CA
		const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
		const adminUser = await provider.getUserContext(adminIdentity, adminUserId);

		// Register the user, enroll the user, and import the new identity into the wallet.
		// if affiliation is specified by client, the affiliation value must be configured in CA
		const secret = await caClient.register({
			affiliation: affiliation,
			enrollmentID: userId,
			role: 'client'
		}, adminUser);
		const enrollment = await caClient.enroll({
			enrollmentID: userId,
			enrollmentSecret: secret
		});
		const x509Identity = {
			credentials: {
				certificate: enrollment.certificate,
				privateKey: enrollment.key.toBytes(),
			},
			mspId: orgMspId,
			type: 'X.509',
		};
		await wallet.put(userId, x509Identity);
		response = `Successfully registered and enrolled user and imported it into the wallet`;
		return response;
	} catch (error) {
		let response = ""
		response = `Failed to register user : ${error}`
		console.error(response);
		return response;
	}
};

exports.setOrgDataCA = (orgName, buildCCPAuditor1, buildCCPAuditor2, buildCCPAuditor3) => {
	let ccp = "";
	let msp = "";
	let caName = "";
	console.log("OrgName: " + orgName)
	switch (orgName) {
        case "auditor1":
            ccp = buildCCPAuditor1();
            msp = "auditor1";
			caName = "ca.auditor1.carbonAccounting.com"
			break;
        case "auditor2":
            ccp = buildCCPAuditor2();
            msp = "auditor2";
			caName = "ca.auditor2.carbonAccounting.com"
			break;
        case "auditor3":
            ccp = buildCCPAuditor3();
            msp = "auditor3";
			caName = "ca.auditor3.carbonAccounting.com"
			break;
		default:
			throw `Requested orgName ${orgName} is not allowed.`
			break;
	}
	
	return { ccp, msp, caName }
};
import { OrbitDBService } from './orbitDbService';

(async () => {
    await OrbitDBService.init();
    const db = new OrbitDBService();
    console.log(await db.getUtilityEmissionsFactorsByDivision('ASCC', 'NERC_REGION'));
    process.exit(0);
})();

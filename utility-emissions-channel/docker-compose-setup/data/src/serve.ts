import { OrbitDBService } from './orbitDbService';

(async () => {
    await OrbitDBService.init();
    const db = new OrbitDBService();
    console.log('Started ...');
})();


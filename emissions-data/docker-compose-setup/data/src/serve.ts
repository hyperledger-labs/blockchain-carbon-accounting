import { OrbitDBService } from './orbitDbService';

(async () => {
    await OrbitDBService.init();
    new OrbitDBService();
    console.log('Started ...');
})();

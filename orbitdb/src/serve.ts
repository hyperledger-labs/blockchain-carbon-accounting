import { OrbitDBService } from './orbitDbService';

(async () => {
    await OrbitDBService.init();
    new OrbitDBService();
    console.log('OrbitDB Started ... (press CTRL-C to stop)');
})();

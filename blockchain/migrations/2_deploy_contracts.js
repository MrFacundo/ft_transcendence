const fs = require('fs');
const PongGameHistory = artifacts.require("PongGameHistory");

module.exports = function (deployer) {
  deployer.deploy(PongGameHistory).then((instance) => {
    const contractAddress = instance.address;
    const data = JSON.stringify({ address: contractAddress }, null, 2);

    fs.writeFile('/usr/src/app/deployedAddress.json', data, (err) => {
      if (err) throw err;
      console.log('Contract address saved in deployedAddress.json');

      // Alterar as permissões do arquivo para leitura e escrita para todos
      fs.chmod('/usr/src/app/deployedAddress.json', 0o666, (err) => {
        if (err) throw err;
        console.log('Permissions for deployedAddress.json have been set to 666');
      });
    });
  });
};
const fs = require('fs');
const PongGameHistory = artifacts.require("PongGameHistory");

module.exports = function (deployer) {
  deployer.deploy(PongGameHistory).then(() => {
    if (PongGameHistory._json) {
      fs.writeFile(
        '/usr/src/app/deployedAddress.json',
        JSON.stringify({ address: PongGameHistory.address }, null, 2),
        (err) => {
          if (err) throw err;
          console.log('Contract address saved in deployedAddress.json');
        }
      );
    }
  });
};
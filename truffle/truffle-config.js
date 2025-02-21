module.exports = {
  networks: {
    development: {
      host: "ganache",  // Nome do serviço Docker para Ganache
      port: 8545,
      network_id: "*",  // Match any network id
    },
  },
  compilers: {
    solc: {
      version: "0.8.0",  // Versão do compilador Solidity
    },
  },
};
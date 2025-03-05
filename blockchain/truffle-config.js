module.exports = {
  networks: {
    development: {
      host: "ganache", // Name of the Docker service for Ganache
      port: 8545,
      network_id: "*",  // Match any network id
    },
  },
  compilers: {
    solc: {
      version: "0.8.0",  // Solidity compiler version
    },
  },
};
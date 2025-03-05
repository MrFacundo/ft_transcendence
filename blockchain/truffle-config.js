module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", // Name of the Docker service for Ganache
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
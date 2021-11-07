const DappToken = artifacts.require("DappToken");
const DappTokenSale = artifacts.require("DappTokenSale");

module.exports = async function (deployer) {
    const tokenPrice = 1000000000000000;
    await deployer.deploy(DappToken, 1000000);
    await deployer.deploy(DappTokenSale, DappToken.address, tokenPrice);
};

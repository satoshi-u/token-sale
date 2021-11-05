const DappToken = artifacts.require("DappToken");

function tokensToWei(n) {
    return web3.utils.toWei(n, 'ether');
}
function tokensFromWei(n) {
    return web3.utils.fromWei(n, 'ether');
}

contract('DappToken', (accounts) => {

    it('initializes ERC20 optional details', function () {
        return DappToken.deployed().then(function (instance) {
            tokenInstance = instance;
            return tokenInstance.name();
        }).then(function (name) {
            assert.equal(name, "Dapp Token", 'has correct token name...')
            return tokenInstance.symbol();
        }).then(function (symbol) {
            assert.equal(symbol, "DAPP", 'has correct token symbol...')
            return tokenInstance.standard();
        }).then(function (standard) {
            assert.equal(standard, "Dapp Token v1.0", 'has correct token standard...')
        })
    })

    it('sets the total supply and allocates initial supply upon deployment', function () {
        return DappToken.deployed().then(function (instance) {
            tokenInstance = instance;
            return tokenInstance.totalSupply();
        }).then(function (totalSupply) {
            assert.equal(totalSupply.toString(), "100", 'sets the total supply to 100...')
            return tokenInstance.balanceOf(accounts[0]);
        }).then(function (adminBalance) {
            assert.equal(adminBalance.toString(), "100", 'allocates initial supply to admin...')
        })
    })
})

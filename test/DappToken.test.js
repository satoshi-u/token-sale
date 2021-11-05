const DappToken = artifacts.require("DappToken");

function tokensToWei(n) {
    return web3.utils.toWei(n, 'ether');
}
function tokensFromWei(n) {
    return web3.utils.fromWei(n, 'ether');
}

contract('DappToken', (accounts) => {

    it('sets the total supply upon deployment', function () {
        return DappToken.deployed().then(function (instance) {
            tokenInstance = instance;
            return tokenInstance.totalSupply();
        }).then(function (totalSupply) {
            assert.equal(totalSupply.toString(), tokensToWei("100"), 'sets the total supply to 100...')
        })
    })
})

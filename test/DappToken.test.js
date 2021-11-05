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
            assert.equal(totalSupply.toString(), "1000000", 'sets the total supply to 100...')
            return tokenInstance.balanceOf(accounts[0]);
        }).then(function (adminBalance) {
            assert.equal(adminBalance.toString(), "1000000", 'allocates initial supply to admin...')
        })
    })

    it('transfers token ownership', function () {
        return DappToken.deployed().then(function (instance) {
            tokenInstance = instance;
            return tokenInstance.transfer.call(accounts[1], 1000001);
        }).then(assert.fail).catch(function (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert...');
            return tokenInstance.transfer.call(accounts[1], 100000, { from: accounts[0] })
        }).then(async function (result) {
            console.log("result transfer.call(): ", result)
            assert.equal(result, true, 'transfer looks legit...');
            let bal0 = await tokenInstance.balanceOf(accounts[0]);
            console.log("bal0: ", bal0.toString())
            let bal1 = await tokenInstance.balanceOf(accounts[1]);
            console.log("bal1", bal1.toString())
            return tokenInstance.transfer(accounts[1], 100000, { from: accounts[0] })
        }).then(function (result) {
            console.log("result transfer(): ", result)
            assert.equal(result.receipt.status, true, 'successful 100k transfer...')
            assert.equal(result.receipt.logs.length, 1, 'triggers one event');
            assert.equal(result.receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
            assert.equal(result.receipt.logs[0].args._from, accounts[0], 'logs the account the tokens are transferred from');
            assert.equal(result.receipt.logs[0].args._to, accounts[1], 'logs the account the tokens are transferred to');
            assert.equal(result.receipt.logs[0].args._value, 100000, 'logs the transfer amount');
            return tokenInstance.balanceOf(accounts[0]);
        }).then(function (balanceOfaccount0) {
            console.log("balanceOfaccount0", balanceOfaccount0.toString())
            assert.equal(balanceOfaccount0.toString(), "900000", '100k removed from sender account after transfer...')
            return tokenInstance.balanceOf(accounts[1]);
        }).then(function (balanceOfaccount1) {
            console.log("balanceOfaccount1", balanceOfaccount1.toString())
            assert.equal(balanceOfaccount1.toString(), "100000", '100k added to receiver account after transfer...')
        })
    })
})

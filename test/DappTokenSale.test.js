const DappTokenSale = artifacts.require("DappTokenSale");
const DappToken = artifacts.require("DappToken");


contract('DappTokenSale', (accounts) => {
    let tokenSaleInstance;
    let tokenInstance;
    const tokenPrice = 1000000000000000; // 1000000000000000 (10**15) WEI = 0.001 ETH
    it('initializes Dapp Token with correct values', function () {
        return DappTokenSale.deployed().then(function (instance) {
            tokenSaleInstance = instance;
            return tokenSaleInstance.address;
        }).then(function (address) {
            assert.notEqual(address, 0x0, 'has an address...')
            return tokenSaleInstance.tokenContract;
        }).then(function (address) {
            assert.notEqual(address, 0x0, 'has the token contract...')
            return tokenSaleInstance.tokenPrice();
        }).then(function (price) {
            assert.equal(price, tokenPrice, 'has correct token prcie...')
        })
    })

    const admin = accounts[0];
    const buyer = accounts[1];
    const numberOfTokensTestBuy = 10;
    const numberOfTokensToTokenSalesContract = 750000;
    it('facilitates token buying', function () {
        return DappToken.deployed().then(function (instance) {
            tokenInstance = instance;
            return DappTokenSale.deployed();
        }).then(function (instance) {
            tokenSaleInstance = instance;
            return tokenInstance.transfer(tokenSaleInstance.address, numberOfTokensToTokenSalesContract, { from: admin });
        }).then(function () {
            return tokenSaleInstance.buyTokens(numberOfTokensTestBuy, { from: buyer, value: numberOfTokensTestBuy * tokenPrice });
        }).then(function (receipt) {
            assert.equal(receipt.logs.length, 1, 'triggers one event');
            assert.equal(receipt.logs[0].event, 'Sell', 'should be the "Sell" event');
            assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens');
            assert.equal(receipt.logs[0].args._numberOfTokens, numberOfTokensTestBuy, 'logs the number of tokens purchased');
            return tokenSaleInstance.tokensSold();
        }).then(function (amount) {
            assert.equal(amount, numberOfTokensTestBuy, 'increments the number of tokens sold...');
            return tokenInstance.balanceOf(buyer);
        }).then(function (balance) {
            assert.equal(balance, numberOfTokensTestBuy, 'buyer balance after buyTokens correct...');
            return tokenInstance.balanceOf(tokenSaleInstance.address);
        }).then(function (balance) {
            assert.equal(balance, numberOfTokensToTokenSalesContract - numberOfTokensTestBuy, 'DappTokenSale balance after buyTokens correct...');
            return tokenSaleInstance.buyTokens(numberOfTokensTestBuy, { from: buyer, value: 1 });
        }).then(assert.fail).catch(function (error) {
            assert(error.message.indexOf('revert') >= 0, 'msg.value should not be less than numberOfTokensTestBuy * tokenPrice');
            return tokenSaleInstance.buyTokens(800000, { from: buyer, value: numberOfTokensTestBuy * tokenPrice });
        }).then(assert.fail).catch(function (error) {
            assert(error.message.indexOf('revert') >= 0, "can't purchase more token than available");
        })
    })

    it('ends token sale', function () {
        return DappToken.deployed().then(function (instance) {
            tokenInstance = instance;
            return DappTokenSale.deployed();
        }).then(function (instance) {
            tokenSaleInstance = instance;
            return tokenSaleInstance.endSale({ from: buyer })
        }).then(assert.fail).catch(function (error) {
            assert(error.message.indexOf('revert') >= 0, "only admin can end sale");
            return tokenSaleInstance.endSale({ from: admin })
        }).then(function (result) {
            assert.equal(result.receipt.status, true, 'endSale done by admin');
            return tokenInstance.balanceOf(admin);
        }).then(function (balance) {
            assert.equal(balance, 999990, 'returns left tokens back to admin');
            return tokenSaleInstance.tokenPrice();
        }).then(function (_tokenPrice) {
            // assert.equal(_tokenPrice, 0, 'token price reset to 0, contract dsabled'); // check later
        })
    })
})

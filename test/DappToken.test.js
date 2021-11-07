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
            // Note: call doesnt't create a txn. calls fn in solidity without writing to the blockchain - test - to inspect return values
            return tokenInstance.transfer.call(accounts[1], 100000, { from: accounts[0] })
        }).then(async function (result) {
            // console.log("result transfer.call(): ", result)
            assert.equal(result, true, 'transfer returns true...');
            // Aactual Transfer -> returns txn details ->  we work with logs-> events emitted
            return tokenInstance.transfer(accounts[1], 100000, { from: accounts[0] })
        }).then(function (result) {
            // console.log("result transfer(): ", result)
            assert.equal(result.receipt.status, true, 'successful 100k transfer...')
            assert.equal(result.receipt.logs.length, 1, 'triggers one event');
            assert.equal(result.receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
            assert.equal(result.receipt.logs[0].args._from, accounts[0], 'logs the account the tokens are transferred from');
            assert.equal(result.receipt.logs[0].args._to, accounts[1], 'logs the account the tokens are transferred to');
            assert.equal(result.receipt.logs[0].args._value, 100000, 'logs the transfer amount');
            return tokenInstance.balanceOf(accounts[0]);
        }).then(function (balanceOfaccount0) {
            assert.equal(balanceOfaccount0.toString(), "900000", '100k removed from sender account after transfer...')
            return tokenInstance.balanceOf(accounts[1]);
        }).then(function (balanceOfaccount1) {
            assert.equal(balanceOfaccount1.toString(), "100000", '100k added to receiver account after transfer...')
        })
    })

    it('approves tokens for delegated transfer', function () {
        return DappToken.deployed().then(function (instance) {
            tokenInstance = instance;
            return tokenInstance.approve.call(accounts[1], 100, { from: accounts[0] });
        }).then(function (result) {
            assert.equal(result, true, 'approve returns true...');
            return tokenInstance.approve(accounts[1], 100, { from: accounts[0] });
        }).then(function (receipt) {
            // console.log("receipt approve(): ", receipt) // *same as result ???!!
            assert.equal(receipt.logs.length, 1, 'triggers one event');
            assert.equal(receipt.logs[0].event, 'Approval', 'should be the "Approval" event');
            assert.equal(receipt.logs[0].args._owner, accounts[0], 'logs the account the tokens are authorized by');
            assert.equal(receipt.logs[0].args._spender, accounts[1], 'logs the account the tokens are authorized to');
            assert.equal(receipt.logs[0].args._value, 100, 'logs the transfer amount');
            return tokenInstance.allowance(accounts[0], accounts[1]);
        }).then(function (allowance) {
            assert.equal(allowance.toNumber(), 100, 'stores the allowance for delegated trasnfer');
        })
    })

    it('handles delegated token transfers', function () {
        return DappToken.deployed().then(function (instance) {
            tokenInstance = instance;
            fromAccount = accounts[2];
            toAccount = accounts[3];
            spendingAccount = accounts[4];
            // Transfer some tokens to fromAccount
            return tokenInstance.transfer(fromAccount, 100, { from: accounts[0] });
        }).then(function (receipt) {
            // Approve spendingAccount to spend 10 tokens from fromAccount
            return tokenInstance.approve(spendingAccount, 10, { from: fromAccount });
        }).then(function (receipt) {
            // Try transferring something larger than the sender's balance
            return tokenInstance.transferFrom(fromAccount, toAccount, 9999, { from: spendingAccount });
        }).then(assert.fail).catch(function (error) {
            assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than balance');
            // Try transferring something larger than the approved amount
            return tokenInstance.transferFrom(fromAccount, toAccount, 20, { from: spendingAccount });
        }).then(assert.fail).catch(function (error) {
            assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than approved amount');
            return tokenInstance.transferFrom.call(fromAccount, toAccount, 10, { from: spendingAccount });
        }).then(function (success) {
            assert.equal(success, true);
            return tokenInstance.transferFrom(fromAccount, toAccount, 10, { from: spendingAccount });
        }).then(function (receipt) {
            assert.equal(receipt.logs.length, 1, 'triggers one event');
            assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
            assert.equal(receipt.logs[0].args._from, fromAccount, 'logs the account the tokens are transferred from');
            assert.equal(receipt.logs[0].args._to, toAccount, 'logs the account the tokens are transferred to');
            assert.equal(receipt.logs[0].args._value, 10, 'logs the transfer amount');
            return tokenInstance.balanceOf(fromAccount);
        }).then(function (balance) {
            assert.equal(balance.toNumber(), 90, 'deducts the amount from the sending account');
            return tokenInstance.balanceOf(toAccount);
        }).then(function (balance) {
            assert.equal(balance.toNumber(), 10, 'adds the amount from the receiving account');
            return tokenInstance.allowance(fromAccount, spendingAccount);
        }).then(function (allowance) {
            assert.equal(allowance.toNumber(), 0, 'deducts the amount from the allowance');
        });
    })
})

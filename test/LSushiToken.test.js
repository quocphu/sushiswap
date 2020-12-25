const { expectRevert } = require('@openzeppelin/test-helpers');
const SushiToken = artifacts.require('SushiToken');

contract('SushiToken', ([alice, bob, carol, operationWallet]) => {
    beforeEach(async () => {
        this.sushi = await SushiToken.new(operationWallet, { from: alice });
    });

    it('should have correct name and symbol and decimal', async () => {
        const name = await this.sushi.name();
        const symbol = await this.sushi.symbol();
        const decimals = await this.sushi.decimals();
        assert.equal(name.valueOf(), 'LYN.FINANCE');
        assert.equal(symbol.valueOf(), 'LYNFI');
        assert.equal(decimals.valueOf(), '18');
    });

    it('Should mint 7500 token to operationWallet after deployed', async ()=>{
        var preAmount = await this.sushi.balanceOf.call(operationWallet);
        assert.equal(preAmount.toString(10), "7500000000000000000000")
    })
  });

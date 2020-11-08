const { expectRevert, time } = require('@openzeppelin/test-helpers');
const SushiToken = artifacts.require('SushiToken');
const MasterChef = artifacts.require('MasterChef');
const MockERC20 = artifacts.require('MockERC20');
const BN = require('web3').utils.BN;
contract('MasterChef', ([alice, bob, carol, dev, op, minter]) => {
    async function mintBlock(num) {
        for (var i = 0; i < num; i++) {
            await time.advanceBlock();
        }
    }
    var dec = new BN("1000000000000000000", 10) // 10^18
    var decZero = '000000000000000000'
    var sushiPerBlock = new BN('13434504110000000',10);
    var mintAmount = dec.mul(new BN(1000, 10));
    var totalLPSupply = dec.mul(new BN('10000000000', 10))

    var BN16 = new BN(16, 10);
    var BN8 = new BN(8, 10);
    var BN4 = new BN(4, 10);
    var BN2 = new BN(2, 10);
    var BN1 = new BN(1, 10);

    var WEEK_BLOCKS = new BN(10, 10);
    var PHASE1_DURATION = WEEK_BLOCKS;
    var PHASE2_DURATION = PHASE1_DURATION.mul(new BN(2, 10));
    var PHASE3_DURATION = PHASE2_DURATION.mul(new BN(2, 10));
    var PHASE4_DURATION = PHASE3_DURATION.mul(new BN(2, 10));
    var PHASE5_DURATION = PHASE4_DURATION.mul(new BN(2, 10));

    var DURATION_1_2 = PHASE1_DURATION.add(PHASE2_DURATION);
    var DURATION_1_3 = DURATION_1_2.add( PHASE3_DURATION);
    var DURATION_1_4 = DURATION_1_3.add(PHASE4_DURATION);
    var DURATION_1_5 = DURATION_1_4.add(PHASE5_DURATION);

    beforeEach(async () => {
        this.sushi = await SushiToken.new({ from: alice });

        this.lp = await MockERC20.new('LPToken', 'LP', totalLPSupply, { from: minter });
        await this.lp.transfer(alice, mintAmount, { from: minter });
        await this.lp.transfer(bob, mintAmount, { from: minter });
        await this.lp.transfer(carol, mintAmount, { from: minter });

        this.lp2 = await MockERC20.new('LPToken2', 'LP2', totalLPSupply, { from: minter });
        await this.lp2.transfer(alice, mintAmount, { from: minter });
        await this.lp2.transfer(bob, mintAmount, { from: minter });
        await this.lp2.transfer(carol, mintAmount, { from: minter });
    });

    it('should return a right multiplier', async () => {
        var startBlock = await time.latestBlock();
        this.chef = await MasterChef.new(this.sushi.address, dev, op, sushiPerBlock, startBlock, { from: alice });
        // In 1st phase
        var expectation = '80';
        var fromBlock = startBlock;
        var toBlock = startBlock.add(new BN('5', 10))
        var rs = await this.chef.getMultiplier(fromBlock, toBlock); // 5 blocks
        assert.equal(rs.toString(10), expectation);

        // Full 1st phase
        toBlock = fromBlock.add(PHASE1_DURATION);
        expectation = PHASE1_DURATION.mul(BN16);
        console.log(`${fromBlock}-${toBlock} = ${fromBlock.sub(toBlock).toString(10)}`);
        var rs = await this.chef.getMultiplier(fromBlock, toBlock); // 10 blocks
        assert.equal(rs.toString(10), expectation.toString(10));


        // In 2nd phase
        var expectation = '40';
        var fromBlock = startBlock.add(PHASE1_DURATION);
        var toBlock = fromBlock.add(new BN('5', 10))
        var rs = await this.chef.getMultiplier(fromBlock, toBlock);
        assert.equal(rs.toString(10), expectation);

        var expectation = PHASE2_DURATION.mul(BN8);
        var toBlock = fromBlock.add(PHASE2_DURATION)
        var rs = await this.chef.getMultiplier(fromBlock, toBlock);
        assert.equal(rs.toString(10), expectation.toString(10));

        // In 3rd phase
        var expectation = '20';
        var fromBlock = startBlock.add(DURATION_1_2);
        var toBlock = fromBlock.add(new BN('5', 10))
        var rs = await this.chef.getMultiplier(fromBlock, toBlock);
        assert.equal(rs.toString(10), expectation);

        var expectation = PHASE3_DURATION.mul(BN4)
        var toBlock = fromBlock.add(PHASE3_DURATION)
        var rs = await this.chef.getMultiplier(fromBlock, toBlock);
        assert.equal(rs.toString(10), expectation.toString(10));

        // In 4th phase
        var expectation = '10';
        var fromBlock = startBlock.add(DURATION_1_3);
        var toBlock = fromBlock.add(new BN('5', 10))
        var rs = await this.chef.getMultiplier(fromBlock, toBlock);
        assert.equal(rs.toString(10), expectation);

        var expectation = PHASE4_DURATION.mul(BN2)
        var toBlock = fromBlock.add(PHASE4_DURATION)
        var rs = await this.chef.getMultiplier(fromBlock, toBlock);
        assert.equal(rs.toString(10), expectation.toString(10));

        // In 5th phase
        var expectation = '5';
        var fromBlock = startBlock.add(DURATION_1_4);
        var toBlock = fromBlock.add(new BN('5', 10))
        var rs = await this.chef.getMultiplier(fromBlock, toBlock);
        assert.equal(rs.toString(10), expectation);

        var expectation = PHASE5_DURATION.mul(BN1);
        var toBlock = fromBlock.add(PHASE5_DURATION)
        var rs = await this.chef.getMultiplier(fromBlock, toBlock);
        assert.equal(rs.toString(10), expectation.toString(10));

        // From is out of 5eth
        var expectation = '0';
        var fromBlock = startBlock.add(DURATION_1_5);
        var toBlock = fromBlock.add(new BN('50', 10))
        var rs = await this.chef.getMultiplier(fromBlock, toBlock);
        assert.equal(rs.toString(10), expectation);

        //////////// Overlap
        // Phase 1 and phase 2
        var expectation = 5*16 + 3*8;
        var phase1Block = new BN(5, 10);
        var fromBlock = startBlock.add(PHASE1_DURATION.sub(phase1Block)) // 5 block in phase 1
        var toBlock = startBlock.add(PHASE1_DURATION).add(new BN(3, 10)) // 3 block in phase 2
        var rs = await this.chef.getMultiplier(fromBlock, toBlock);
        assert.equal(rs.toString(10), expectation + '');

        // Phase 1 and phase 3
        var expectation = 5*16 + 20*8 + 4*4;
        var fromBlock = startBlock.add(PHASE1_DURATION.sub(phase1Block)) // 5 block in phase 1
        var toBlock = startBlock.add(DURATION_1_2).add(new BN(4, 10)) // 4 block in phase 3
        var rs = await this.chef.getMultiplier(fromBlock, toBlock);
        assert.equal(rs.toString(10), expectation + '');

        // Phase 1 and phase 4
        var expectation = 5*16 + 20*8 + 40*4 + 4*2;
        var fromBlock = startBlock.add(PHASE1_DURATION.sub(phase1Block)) // 5 block in phase 1
        var toBlock = startBlock.add(DURATION_1_3).add(new BN(4, 10)) // 4 block in phase 4
        var rs = await this.chef.getMultiplier(fromBlock, toBlock);
        assert.equal(rs.toString(10), expectation + '');

        // Phase 1 and phase 5
        var expectation = 5*16 + 20*8 + 40*4 + 80*2 + 4*1;
        var fromBlock = startBlock.add(PHASE1_DURATION.sub(phase1Block)) // 5 block in phase 1
        var toBlock = startBlock.add(DURATION_1_4).add(new BN(4, 10)) // 4 block in phase 5
        var rs = await this.chef.getMultiplier(fromBlock, toBlock);
        assert.equal(rs.toString(10), expectation + '');

        // Before phase 1 and after phas 5
        var expectation = 10*16 + 20*8 + 40*4 + 80*2 + 160*1;
        var fromBlock = startBlock.sub(PHASE1_DURATION) // 5 block in phase 1
        var toBlock = startBlock.add(DURATION_1_5).add(new BN(4, 10)) // 4 block in phase 5
        var rs = await this.chef.getMultiplier(fromBlock, toBlock);
        assert.equal(rs.toString(10), expectation + '');
    })

});

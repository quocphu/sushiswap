const { expectRevert, time } = require('@openzeppelin/test-helpers');
const SushiToken = artifacts.require('SushiToken');
const MasterChef = artifacts.require('MasterChef');
const MockERC20 = artifacts.require('MockERC20');
const BN = require('web3').utils.BN;
contract('MasterChef', ([alice, bob, carol, dave, dev, op, minter]) => {
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

    var BN3 = new BN(3, 10);

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
        await this.lp.transfer(dave, mintAmount, { from: minter });

        this.lp2 = await MockERC20.new('LPToken2', 'LP2', totalLPSupply, { from: minter });
        await this.lp2.transfer(alice, mintAmount, { from: minter });
        await this.lp2.transfer(bob, mintAmount, { from: minter });
        await this.lp2.transfer(carol, mintAmount, { from: minter });
        await this.lp2.transfer(dave, mintAmount, { from: minter });
    });

    it('should give out SUSHIs only after farming time', async () => { return;// TODO
        // Start at block 100
        var latestBlock = await time.latestBlock();
        startBlock = latestBlock.add(new BN(15,10));
        this.chef = await MasterChef.new(this.sushi.address, dev, op, sushiPerBlock, startBlock, { from: alice });
        await this.sushi.transferOwnership(this.chef.address, { from: alice }); // block 1
        await this.chef.add('1', this.lp.address, true); // block 2
        await this.lp.approve(this.chef.address, '1000'+decZero, { from: bob }); // block 3

        // Deposit before start
        await this.chef.deposit(0, '100', { from: bob }); // block 4
        await mintBlock(2); // block 6
        await this.chef.deposit(0, '0', { from: bob }); // block 7
        assert.equal((await this.sushi.balanceOf(bob)).valueOf(), '0');
        await mintBlock(2) // block 9
        await this.chef.deposit(0, '0', { from: bob }); // block 10
        assert.equal((await this.sushi.balanceOf(bob)).valueOf(), '0');

        await mintBlock(1);
        await this.chef.deposit(0, '0', { from: bob }); // block 12
        assert.equal((await this.sushi.balanceOf(bob)).valueOf(), '0');

        await mintBlock(2); // block 13
        await this.chef.deposit(0, '0', { from: bob }); // block 14
        
        var latestBlock = await time.latestBlock();
        console.log('duration ', latestBlock.sub(startBlock).toString(10));

        assert.equal((await this.sushi.balanceOf(bob)).toString(10), sushiPerBlock.mul(BN16).toString(10));

        await mintBlock(3) // block 19
        await this.chef.deposit(0, '0', { from: bob }); // block 20
        var latestBlock = await time.latestBlock();
        console.log('duration ', latestBlock.sub(startBlock).toString(10));

        var expectedBalance = new BN(5,10).mul(sushiPerBlock.mul(BN16))
        var extraAmount = expectedBalance.div(new BN(10,10))
        assert.equal((await this.sushi.balanceOf(bob)).toString(10), expectedBalance.toString(10));
        assert.equal((await this.sushi.balanceOf(dev)).toString(10), extraAmount);
        assert.equal((await this.sushi.balanceOf(op)).toString(10), extraAmount);
        assert.equal((await this.sushi.totalSupply()).toString(10), expectedBalance.add(extraAmount).add(extraAmount).toString(10));

        // Go to 2nd phase, reward
        await mintBlock(5) // block 25

        // 1 block in phase 2
        await this.chef.deposit(0, '0', { from: bob }); // block 26
        var p1Rw = new BN(10,10).mul(sushiPerBlock.mul(BN16)) // P1 reward
        var p2Rw = new BN(1,10).mul(sushiPerBlock.mul(BN8)) // P2 reward
        var expectedBalance = p1Rw.add(p2Rw);
        assert.equal((await this.sushi.balanceOf(bob)).toString(10), expectedBalance.toString(10));

        // 2 blocks in phase 2
        await this.chef.deposit(0, '0', { from: bob }); // block 27
        var p1Rw = new BN(10,10).mul(sushiPerBlock.mul(BN16)) // P1 reward
        var p2Rw = new BN(2,10).mul(sushiPerBlock.mul(BN8)) // P2 reward
        var expectedBalance = p1Rw.add(p2Rw);
        assert.equal((await this.sushi.balanceOf(bob)).toString(10), expectedBalance.toString(10));

        // Go to 3rd phase, reward
        await mintBlock(18) // block 45

        // 1 block in phase 3
        await this.chef.deposit(0, '0', { from: bob }); // block 46
        var p1Rw = new BN(10,10).mul(sushiPerBlock.mul(BN16)) // P1 reward
        var p2Rw = new BN(20,10).mul(sushiPerBlock.mul(BN8)) // P2 reward
        var p3Rw = new BN(1,10).mul(sushiPerBlock.mul(BN4)) // P3 reward
        var expectedBalance = p1Rw.add(p2Rw).add(p3Rw);
        assert.equal((await this.sushi.balanceOf(bob)).toString(10), expectedBalance.toString(10));

        // 2 blocks in phase 3
        await this.chef.deposit(0, '0', { from: bob }); // block 47
        var p1Rw = new BN(10,10).mul(sushiPerBlock.mul(BN16)) // P1 reward
        var p2Rw = new BN(20,10).mul(sushiPerBlock.mul(BN8)) // P2 reward
        var p3Rw = new BN(2,10).mul(sushiPerBlock.mul(BN4)) // P3 reward
        var expectedBalance = p1Rw.add(p2Rw).add(p3Rw);
        assert.equal((await this.sushi.balanceOf(bob)).toString(10), expectedBalance.toString(10));

        // Go to 4th phase, reward
         await mintBlock(38) // block 85

         // 1 block in phase 4
         await this.chef.deposit(0, '0', { from: bob }); // block 86
         var p1Rw = new BN(10,10).mul(sushiPerBlock.mul(BN16)) // P1 reward
         var p2Rw = new BN(20,10).mul(sushiPerBlock.mul(BN8)) // P2 reward
         var p3Rw = new BN(40,10).mul(sushiPerBlock.mul(BN4)) // P3 reward
         var p4Rw = new BN(1,10).mul(sushiPerBlock.mul(BN2)) // P4 reward
         var expectedBalance = p1Rw.add(p2Rw).add(p3Rw).add(p4Rw);
         assert.equal((await this.sushi.balanceOf(bob)).toString(10), expectedBalance.toString(10));
 
         // 2 blocks in phase 4
         await this.chef.deposit(0, '0', { from: bob }); // block 87
         var p1Rw = new BN(10,10).mul(sushiPerBlock.mul(BN16)) // P1 reward
         var p2Rw = new BN(20,10).mul(sushiPerBlock.mul(BN8)) // P2 reward
         var p3Rw = new BN(40,10).mul(sushiPerBlock.mul(BN4)) // P3 reward
         var p4Rw = new BN(2,10).mul(sushiPerBlock.mul(BN2)) // P4 reward
         var expectedBalance = p1Rw.add(p2Rw).add(p3Rw).add(p4Rw);
         assert.equal((await this.sushi.balanceOf(bob)).toString(10), expectedBalance.toString(10));

        // Go to 5th phase, reward
        await mintBlock(78) // block 155
        // 1 block in phase 4
        await this.chef.deposit(0, '0', { from: bob }); // block 156
        var p1Rw = new BN(10,10).mul(sushiPerBlock.mul(BN16)) // P1 reward
        var p2Rw = new BN(20,10).mul(sushiPerBlock.mul(BN8)) // P2 reward
        var p3Rw = new BN(40,10).mul(sushiPerBlock.mul(BN4)) // P3 reward
        var p4Rw = new BN(80,10).mul(sushiPerBlock.mul(BN2)) // P4 reward
        var p5Rw = new BN(1,10).mul(sushiPerBlock.mul(BN1)) // P5 reward
        var expectedBalance = p1Rw.add(p2Rw).add(p3Rw).add(p4Rw).add(p5Rw);
        assert.equal((await this.sushi.balanceOf(bob)).toString(10), expectedBalance.toString(10));
        
         // 2 blocks in phase 4
        await this.chef.deposit(0, '0', { from: bob }); // block 157
        var p1Rw = new BN(10,10).mul(sushiPerBlock.mul(BN16)) // P1 reward
        var p2Rw = new BN(20,10).mul(sushiPerBlock.mul(BN8)) // P2 reward
        var p3Rw = new BN(40,10).mul(sushiPerBlock.mul(BN4)) // P3 reward
        var p4Rw = new BN(80,10).mul(sushiPerBlock.mul(BN2)) // P4 reward
        var p5Rw = new BN(2,10).mul(sushiPerBlock.mul(BN1)) // P5 reward
        var expectedBalance = p1Rw.add(p2Rw).add(p3Rw).add(p4Rw).add(p5Rw);
        assert.equal((await this.sushi.balanceOf(bob)).toString(10), expectedBalance.toString(10));

        await mintBlock(157) // block 315
        // OK to Deposit at the end block of phase 5
        await this.chef.deposit(0, '0', { from: bob }); // block 316
        // assert.equal((await this.sushi.balanceOf(bob)).toString(10), expectedBalance.toString(10));
        // Not OK to Deposit after 5th phase
        try {
            await this.chef.deposit(0, '0', { from: bob }); // block 316
            assert.fail("SHOULD FAILED");
        } catch(err) {
            var msg = 'END';
            assert.equal(err.reason, msg)
        }
    });

    it('should distribute SUSHIs properly for each staker', async () => {
        // Start at block 100
        var latestBlock = await time.latestBlock();
        startBlock = latestBlock.add(new BN(15,10));
        this.chef = await MasterChef.new(this.sushi.address, dev, op, sushiPerBlock, startBlock, { from: alice });
        await this.sushi.transferOwnership(this.chef.address, { from: alice }); // block 1
        await this.chef.add('1', this.lp.address, true); // block 2
        await this.lp.approve(this.chef.address, mintAmount, { from: bob }); // block 3
        await this.lp.approve(this.chef.address, mintAmount, { from: carol }); // block 4
        await this.lp.approve(this.chef.address, mintAmount, { from: dave }); // block 5
        
        // Deposit before start
        await this.chef.deposit(0, '100', { from: bob }); // block 6
        await this.chef.deposit(0, '50', { from: carol }); // block 7

        await mintBlock(7); // block 14
        await this.chef.deposit(0, '0', { from: bob }); // block 15
        // Bob's balance = 1*sushiPerBlock*16*2/3
        var expectedBobBl = BN16.mul(BN1).mul(sushiPerBlock).mul(BN2).div(BN3);
        var bobBl = await this.sushi.balanceOf(bob);
        assert.equal(bobBl.toString(10), expectedBobBl.toString(10));

        await this.chef.deposit(0, '0', { from: carol }); // block 16

        // Carol's balance = 2*sushiPerBlock*16*1/3
        var expectedCarolBl = BN16.mul(BN2).mul(sushiPerBlock).mul(BN1).div(BN3);

        var carolBl = await this.sushi.balanceOf(carol);
        assert.equal(carolBl.toString(10), expectedCarolBl.toString(10));

        await this.chef.deposit(0, '50', { from: dave }); // block 17

        await mintBlock(2); // block 19

        await this.chef.deposit(0, '0', { from: dave }); // block 20

        // Dave's balance = 3*sushiPerBlock*16*1/4
        var expectedDaveBl = BN16.mul(BN3).mul(sushiPerBlock).mul(BN1).div(BN4);
        var daveBl = await this.sushi.balanceOf(dave);
        assert.equal(daveBl.toString(10), expectedDaveBl.toString(10));

    });
});

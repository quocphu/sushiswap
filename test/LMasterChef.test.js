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

    it('should give out SUSHIs only after farming time', async () => {
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

        // Deposit after 5th phase
        await mintBlock(158) // block 315
        // 1 block in phase 4
        await this.chef.deposit(0, '0', { from: bob }); // block 316
        assert.equal((await this.sushi.balanceOf(bob)).toString(10), expectedBalance.toString(10));


    });

    it('should distribute SUSHIs properly for each staker', async () => {
        return;
        // 100 per block farming rate starting at block 300 with bonus until block 1000
        this.chef = await MasterChef.new(this.sushi.address, dev, op, sushiPerBlock, 300, { from: alice });
        await this.sushi.transferOwnership(this.chef.address, { from: alice });
        await this.chef.add('1', this.lp.address, true);
        await this.lp.approve(this.chef.address, mintAmount, { from: alice });
        await this.lp.approve(this.chef.address, mintAmount, { from: bob });
        await this.lp.approve(this.chef.address, mintAmount, { from: carol });

        // Alice deposits 10 LPs at block 310
        await time.advanceBlockTo('309');
        await this.chef.deposit(0, '10'+decZero, { from: alice });
        // Bob deposits 20 LPs at block 314
        await time.advanceBlockTo('313');
        await this.chef.deposit(0, '20'+decZero, { from: bob });
        // Carol deposits 30 LPs at block 318
        await time.advanceBlockTo('317');
        await this.chef.deposit(0, '30', { from: carol });
        // Alice deposits 10 more LPs at block 320. At this point:
        //   Alice should have: 4*1000 + 4*1/3*1000 + 2*1/6*1000 = 5666
        //   MasterChef should have the remaining: 10000 - 5666 = 4334
        await time.advanceBlockTo('319')
        await this.chef.deposit(0, '10', { from: alice });
        assert.equal((await this.sushi.totalSupply()).valueOf(), '11000');
        assert.equal((await this.sushi.balanceOf(alice)).valueOf(), '5666');
        assert.equal((await this.sushi.balanceOf(bob)).valueOf(), '0');
        assert.equal((await this.sushi.balanceOf(carol)).valueOf(), '0');
        assert.equal((await this.sushi.balanceOf(this.chef.address)).valueOf(), '4334');
        assert.equal((await this.sushi.balanceOf(dev)).valueOf(), mintAmount);
        // Bob withdraws 5 LPs at block 330. At this point:
        //   Bob should have: 4*2/3*1000 + 2*2/6*1000 + 10*2/7*1000 = 6190
        await time.advanceBlockTo('329')
        await this.chef.withdraw(0, '5', { from: bob });
        assert.equal((await this.sushi.totalSupply()).valueOf(), '22000');
        assert.equal((await this.sushi.balanceOf(alice)).valueOf(), '5666');
        assert.equal((await this.sushi.balanceOf(bob)).valueOf(), '6190');
        assert.equal((await this.sushi.balanceOf(carol)).valueOf(), '0');
        assert.equal((await this.sushi.balanceOf(this.chef.address)).valueOf(), '8144');
        assert.equal((await this.sushi.balanceOf(dev)).valueOf(), '2000');
        // Alice withdraws 20 LPs at block 340.
        // Bob withdraws 15 LPs at block 350.
        // Carol withdraws 30 LPs at block 360.
        await time.advanceBlockTo('339')
        await this.chef.withdraw(0, '20', { from: alice });
        await time.advanceBlockTo('349')
        await this.chef.withdraw(0, '15', { from: bob });
        await time.advanceBlockTo('359')
        await this.chef.withdraw(0, '30', { from: carol });
        assert.equal((await this.sushi.totalSupply()).valueOf(), '55000');
        assert.equal((await this.sushi.balanceOf(dev)).valueOf(), '5000');
        // Alice should have: 5666 + 10*2/7*1000 + 10*2/6.5*1000 = 11600
        assert.equal((await this.sushi.balanceOf(alice)).valueOf(), '11600');
        // Bob should have: 6190 + 10*1.5/6.5 * 1000 + 10*1.5/4.5*1000 = 11831
        assert.equal((await this.sushi.balanceOf(bob)).valueOf(), '11831');
        // Carol should have: 2*3/6*1000 + 10*3/7*1000 + 10*3/6.5*1000 + 10*3/4.5*1000 + 10*1000 = 26568
        assert.equal((await this.sushi.balanceOf(carol)).valueOf(), '26568');
        // All of them should have 1000 LPs back.
        assert.equal((await this.lp.balanceOf(alice)).valueOf(), mintAmount);
        assert.equal((await this.lp.balanceOf(bob)).valueOf(), mintAmount);
        assert.equal((await this.lp.balanceOf(carol)).valueOf(), mintAmount);
    });
});

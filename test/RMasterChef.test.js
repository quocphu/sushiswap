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
    var BN10 = new BN(10, 10);
    var BN6 = new BN(6, 10);

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

        this.lp3 = await MockERC20.new('LPToken3', 'LP3', totalLPSupply, { from: minter });
        await this.lp3.transfer(alice, mintAmount, { from: minter });
        await this.lp3.transfer(bob, mintAmount, { from: minter });
        await this.lp3.transfer(carol, mintAmount, { from: minter });
        await this.lp3.transfer(dave, mintAmount, { from: minter });
    });

    it('should give proper SUSHIs allocation to each pool', async () => { return;
        // Start at block 100
        var latestBlock = await time.latestBlock();
        startBlock = latestBlock.add(new BN(15,10));
        this.chef = await MasterChef.new(this.sushi.address, dev, op, sushiPerBlock, startBlock, { from: alice });
        await this.sushi.transferOwnership(this.chef.address, { from: alice }); // block 1

        // Add pool 0 with weight = 100%
        await this.chef.add('1', this.lp.address, true); // block 2

        await this.lp.approve(this.chef.address, mintAmount, { from: bob }); // block 3


        // Deposit 100 before start
        await this.chef.deposit(0, '100', { from: bob }); // block 4

        await mintBlock(11); // block 15
        await mintBlock(8); // block 20
        await this.chef.massUpdatePools();

        var chefBl = await this.sushi.balanceOf.call(this.chef.address);
        console.log("chef balance", chefBl.toString(10));
        
        var totalSushiSupply = await this.sushi.totalSupply.call();
        console.log('totalSushiSupply ', totalSushiSupply.toString(10));

        var latestBlock = await time.latestBlock();
        var pool1 = await this.chef.poolInfo.call(0)
        var startBlock = await this.chef.startBlock.call()
        console.log(pool1[0]);
        console.log("allocPoint", pool1[1].toString(10));
        console.log("lastRewardBlock", pool1[2].toString(10));
        console.log("accSushiPerShare", pool1[3].toString(10));
        console.log('latestBlock ', latestBlock.toString(10));
        console.log('startBlock ', startBlock.toString(10));
    });

    it('total coin', async()=>{
        // Start at block 100
        var latestBlock = await time.latestBlock();
        startBlock = latestBlock.add(new BN(15,10));
        this.chef = await MasterChef.new(this.sushi.address, dev, op, sushiPerBlock, startBlock, { from: alice });
        await this.sushi.transferOwnership(this.chef.address, { from: alice }); // block 1

        // Add pool 0 with weight = 2
        // Add pool 1 with weight = 4
        await this.chef.add('2', this.lp.address, true); // block 2
        await this.chef.add('4', this.lp2.address, true); // block 3

        await this.lp.approve(this.chef.address, mintAmount, { from: bob }); // block 4
        await this.lp2.approve(this.chef.address, mintAmount, { from: carol }); // block 5
        await this.lp3.approve(this.chef.address, mintAmount, { from: carol }); // block 6
        
        // Deposit 100 before start
        await this.chef.deposit(0, '100', { from: bob }); // block 7
        await this.chef.deposit(1, '100', { from: carol }); // block 8

        await mintBlock(7); // block 15

        // Bob's balance = 1*sushiPerBlock*2/6
        var expectedBobBl = BN16.mul(BN1).mul(sushiPerBlock).mul(BN2).div(BN6);
        var bobBl = await this.chef.pendingSushi(0, bob)
        assert.equal(bobBl.toString(10), expectedBobBl.toString(10));

        // Carol's balance = 1*sushiPerBlock*4/6
        var expectedCarolBl = BN16.mul(BN1).mul(sushiPerBlock).mul(BN4).div(BN6);

        var carolBl = await this.chef.pendingSushi(1, carol)
        assert.equal(carolBl.toString(10), expectedCarolBl.toString(10));

        await mintBlock(9); // block 24

        // Add pool 2 with weight = 8
        await this.chef.add('8', this.lp3.address, true); // block 25

        var chefBl = await this.sushi.balanceOf.call(this.chef.address);
        console.log("chef balance", chefBl.toString(10));

        await this.chef.deposit(2, '100', { from: carol }); // block 26

        await mintBlock(18); // block 44
        await this.chef.massUpdatePools(); // block 45

        var chefBl = await this.sushi.balanceOf.call(this.chef.address);
        console.log("chef balance", chefBl.toString(10));

        var totalAmountPhase1 = sushiPerBlock.mul(BN16).mul(new BN(10, 10))
        var totalAmountPhase2 = sushiPerBlock.mul(BN8).mul(new BN(20,10))
        // assert.equal(chefBl.toString(10), totalAmountPhase1.add(totalAmountPhase2).toString(10))
        console.log('chefBl ', chefBl.toString(10));
        console.log('chefBl ', totalAmountPhase1.add(totalAmountPhase2).toString(10));
        console.log('diff Amount ', chefBl.sub(totalAmountPhase1.add(totalAmountPhase2)).toString(10));
        
        var totalSushiSupply = await this.sushi.totalSupply.call();
        var extraAmount = chefBl.mul(new BN(20,10)).div(new BN(100, 10))
        // assert.equal(totalSushiSupply.toString(10), chefBl.add(extraAmount).toString(10))
        console.log('totalSushiSupply', totalSushiSupply.toString(10));
        console.log('extraAmount', chefBl.add(extraAmount).toString(10));

        console.log('diff ', totalSushiSupply.sub(chefBl.add(extraAmount)).toString(10));

    })
});

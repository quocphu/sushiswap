const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { assertion } = require('@openzeppelin/test-helpers/src/expectRevert');
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
    var BN14 = new BN(14, 10);
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
        this.sushi = await SushiToken.new(op, op, { from: alice });

        this.lp1 = await MockERC20.new('LPToken', 'LP', totalLPSupply, { from: minter });
        await this.lp1.transfer(alice, mintAmount, { from: minter });
        await this.lp1.transfer(bob, mintAmount, { from: minter });
        await this.lp1.transfer(carol, mintAmount, { from: minter });

        this.lp2 = await MockERC20.new('LPToken2', 'LP2', totalLPSupply, { from: minter });
        await this.lp2.transfer(alice, mintAmount, { from: minter });
        await this.lp2.transfer(bob, mintAmount, { from: minter });
        await this.lp2.transfer(carol, mintAmount, { from: minter });

        this.lp3 = await MockERC20.new('LPToken3', 'LP3', totalLPSupply, { from: minter });
        await this.lp3.transfer(alice, mintAmount, { from: minter });
        await this.lp3.transfer(bob, mintAmount, { from: minter });
        await this.lp3.transfer(carol, mintAmount, { from: minter });

        this.lp4 = await MockERC20.new('LPToken3', 'LP3', totalLPSupply, { from: minter });
        await this.lp4.transfer(alice, mintAmount, { from: minter });
        await this.lp4.transfer(bob, mintAmount, { from: minter });
        await this.lp4.transfer(carol, mintAmount, { from: minter });
        await this.lp4.transfer(dev, mintAmount, { from: minter });
    });

    it('Pool distribution', async () => {
        // Start at block 100
        var latestBlock = await time.latestBlock();
        startBlock = latestBlock.add(new BN(15,10));
        this.chef = await MasterChef.new(this.sushi.address, sushiPerBlock, startBlock, { from: alice });
        await this.sushi.transferOwnership(this.chef.address, { from: alice }); // block 1

        // Add pools
        await this.chef.add('1', this.lp1.address, true); // block 2
        await this.chef.add('1', this.lp2.address, true); // block 3
        await this.chef.add('4', this.lp3.address, true); // block 4
        await this.chef.add('8', this.lp4.address, true); // block 5

        await this.lp1.approve(this.chef.address, mintAmount, { from: alice }); // block 6
        await this.lp2.approve(this.chef.address, mintAmount, { from: bob }); // block 7
        await this.lp3.approve(this.chef.address, mintAmount, { from: carol }); // block 8
        await this.lp4.approve(this.chef.address, mintAmount, { from: dev }); // block 9
        
        // Deposit 100 before start
        await this.chef.deposit(0, '100', { from: alice }); // block 10
        await this.chef.deposit(1, '100', { from: bob }); // block 11
        await this.chef.deposit(2, '100', { from: carol }); // block 12
        await this.chef.deposit(3, '100', { from: dev }); // block 13

        var totalAllocPoint = await this.chef.totalAllocPoint.call()

        console.log('totalAllocPoint ', totalAllocPoint.toString(10));

        await mintBlock(2); // block 15

        // Alice balance = 1* sushiPerBlock *1/14
        // Bob's balance = 1*sushiPerBlock*1/14
        // Carol's balance = 1*sushiPerBlock*4/14
        // Dev's balance = 1*sushiPerBlock*8/14
        var expectedABl = BN16.mul(sushiPerBlock).mul(BN1).div(BN14);
        // Carol's balance = 1*sushiPerBlock*4/6
        var expectedCarolBl = BN16.mul(sushiPerBlock).mul(BN4).div(BN14);
        var expectedDevBl = BN16.mul(sushiPerBlock).mul(BN4).div(BN14);

        await this.chef.deposit(0, '0', { from: alice }); // block 16
        await this.chef.deposit(1, '0', { from: bob }); // block 17
        await this.chef.deposit(2, '0', { from: carol }); // block 18
        await this.chef.deposit(3, '0', { from: dev }); // block 19

        
        var currentBlock = await time.latestBlock();
        console.log('currentBlock ', currentBlock.toString(10));
        console.log('dis ', currentBlock.sub(startBlock).toString(10));

        var asushi =  await this.sushi.balanceOf.call(alice);
        var bsushi =  await this.sushi.balanceOf.call(bob);
        var csushi =  await this.sushi.balanceOf.call(carol);
        var dsushi =  await this.sushi.balanceOf.call(dev);

        console.log('asushi ', asushi.toString(10));
        console.log('bsushi ', bsushi.toString(10));
        console.log('csushi ', csushi.toString(10));
        console.log('dsushi ', dsushi.toString(10));

        // var aliceBl = await this.chef.pendingSushi(0, alice)
        // var bobBl = await this.chef.pendingSushi(1, bob)
        // var carolBl = await this.chef.pendingSushi(2, carol)
        // var devBl = await this.chef.pendingSushi(3, dev)

        var aliceBl = expectedABl.mul(new BN(2,10))
        var bobBl = expectedABl.mul(new BN(3,10))
        var carolBl = expectedCarolBl.mul(new BN(4,10))
        var devBl = expectedDevBl.mul(new BN(5,10))

        
        // assert.equal(asushi.toString(10), aliceBl.toString(10), "alice")
        // assert.equal(bsushi.toString(10), bobBl.toString(10), "bobBl")
        // assert.equal(csushi.toString(10), carolBl.toString(10), "carolBl")
        // assert.equal(dsushi.toString(10), devBl.toString(10), "devBl")

        console.log(expectedABl.toString(10), aliceBl.toString(10), asushi.toString(10), "alice")
        console.log(expectedABl.toString(10), bobBl.toString(10), bsushi.toString(10),"bobBl")
        console.log(expectedCarolBl.toString(10), carolBl.toString(10), csushi.toString(10),"carolBl")
        console.log(expectedDevBl.toString(10), devBl.toString(10), dsushi.toString(10),"devBl")

    })

});

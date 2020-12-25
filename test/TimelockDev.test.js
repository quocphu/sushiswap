const { expectRevert, time } = require('@openzeppelin/test-helpers');

const SushiToken = artifacts.require('SushiToken');
const TimelockDev = artifacts.require('TimelockDev');

contract('Timelock dev', ([alice, bob, carol, op, minter]) => {

    var lockAmount = "2500000000000000000000"
    var opAmount = "7500000000000000000000"
    var lockTime = 86400;//1 day
    beforeEach(async () => {
        this.timelock = await TimelockDev.new(lockTime, { from: minter });
        this.sushi = await SushiToken.new(op, this.timelock.address, { from: minter });
        await this.timelock.setToken(this.sushi.address, {from: minter})
    });

    it("Should mint right amount", async () => {
        var opB = await this.sushi.balanceOf.call(op)
        var lockB = await this.sushi.balanceOf.call(this.timelock.address)

        assert.equal(opB.toString(10), opAmount)
        assert.equal(lockB.toString(10), lockAmount)
    })

    it("Fail to withdraw when not mature", async () => {

        await expectRevert(this.timelock.withdraw({ from: minter }),"revert")

        await time.increase(lockTime+1)

        await expectRevert(this.timelock.withdraw({ from: bob }),"Ownable: caller is not the owner")

        await this.timelock.withdraw({ from: minter })

        var mB = await this.sushi.balanceOf.call(minter)

        assert.equal(mB.toString(10), lockAmount)

    })
})
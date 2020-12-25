pragma solidity ^0.6.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// This contract locked token in 1 year
contract TimelockDev is Ownable {
    IERC20 public token;
    uint256 public lockTime;
    uint256 public startTime;

    // _lockTime: in seconds
    constructor(uint256 _lockTime) public {
        startTime = block.timestamp;
        lockTime = _lockTime;
    }

    function withdraw() public onlyOwner() {
        uint256 amount = token.balanceOf(address(this));

        require(amount>0,"empty balance");
        require(startTime + lockTime < block.timestamp, "Not mature");

        token.transfer(msg.sender, amount);
    }

    function setToken(address tokenAddr) public onlyOwner() {
        token = IERC20(tokenAddr);
    }
}
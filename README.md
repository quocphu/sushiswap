# SushiSwap 🍣

https://app.sushiswap.org. Feel free to read the code. More details coming soon.

## Deployed Contracts / Hash

- SushiToken - https://etherscan.io/token/0x6b3595068778dd592e39a122f4f5a5cf09c90fe2
- MasterChef - https://etherscan.io/address/0xc2edad668740f1aa35e4d8f227fb8e17dca888cd
- (Uni|Sushi)swapV2Factory - https://etherscan.io/address/0xc0aee478e3658e2610c5f7a4a2e1777ce9e4f2ac
- (Uni|Sushi)swapV2Router02 - https://etherscan.io/address/0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f
- (Uni|Sushi)swapV2Pair init code hash - `e18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303`
- SushiBar - https://etherscan.io/address/0x8798249c2e607446efb7ad49ec89dd1865ff4272
- SushiMaker - https://etherscan.io/address/0x6684977bBED67e101BB80Fc07fCcfba655c0a64F
- Migrator2 - https://etherscan.io/address/0x60A02cD1e3443E8ab7825DccF8d7080Eb78BCA6F

## License

WTFPL

## -----------------
last commit:8299029013e151b6e7fff9634ba439d91ae3487a
## -----------------

## Deploy order
* UniswapFactory --> get code hash
* UniswapRouter <-- change code hash from preceded step
* SushiToken
* MasterChef <-- Update migrator
* Migrator
* SushiBar
* SushiMaker <-- Factory is uniswap factory

Rinkeby:
WETH: 0xc778417E063141139Fce010982780140Aa0cD5Ab
UniFactory: 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f

Factory: 0x8215Cb35fE3f485Bd573a4DbA3F72a818E5E9ddF
Router: 0x9b0ef603998982F787c731Cf5247A902c1885961 --> 0xF38BC07e176C8A0Bed3D113d2e5Fb04C8C56728f
SushiToken: 0x629E8e24347bf76173047B44e6e3DF98f85419A1
MasterChef: 0x7151d6974B25276B3e65E9a72F161DE4e2126017
Migrator: 0x7671999f09dcD8b49acb4DFe0eD24b113F200c00

Transfer onwership of Sushi token to MasterChef,
Add pool in MasterChef

ERC20 token
FreeX: 0xee7f4606be40fc672de58217170d045f1aceb045
FreeY: 0x88F377118382c382992873AB9CCc5a30535f5Fb0
Uniswap pair: 0x113f6091f59b200227a0ce7439ffcc274594c057
# Chain Cosmos 区块链服务器

一个基于 Node.js + Fastify 构建的完整区块链后端服务，实现了区块链的核心功能包括代币管理、钱包系统、挖矿机制和交易处理。

## 📋 项目概述

Chain Cosmos Server 是一个从零开始构建的区块链系统后端，实现了完整的区块链核心功能。采用模块化架构设计，提供 RESTful API 接口，支持代币铸造、转账、挖矿奖励和钱包管理等关键业务功能。

## 🏗️ 技术架构

### 技术栈
- **Node.js** - JavaScript 运行时环境
- **Fastify** - 高性能 Web 框架
- **@fastify/cors** - 跨域资源共享插件
- **UUID** - 唯一标识符生成
- **Node.js Crypto** - 原生加密模块（SHA-256, RIPEMD-160）
- **ES Modules** - 现代 JavaScript 模块系统

### 项目结构
```
chain-cosmos-server/
├── src/
│   ├── core/                      # 区块链核心模块
│   │   ├── Blockchain.js          # 区块链主类 - 管理整个链结构
│   │   ├── Block.js               # 区块类 - 单个区块的数据结构和挖矿
│   │   ├── Transaction.js         # 交易类 - 交易数据和验证逻辑
│   │   ├── TokenManager.js        # 代币管理器 - 代币铸造、销毁和统计
│   │   └── TransferManager.js     # 转账管理器 - 转账逻辑和历史记录
│   ├── wallet/                    # 钱包系统
│   │   └── Wallet.js              # 钱包类和钱包管理器
│   ├── mining/                    # 挖矿系统
│   │   └── MiningManager.js       # 挖矿管理器 - 矿工注册、挖矿控制
│   ├── api/                       # API 路由层
│   │   └── routes/                # 路由定义
│   │       ├── blockchain.js      # 区块链相关 API 端点
│   │       ├── wallet.js          # 钱包管理 API 端点
│   │       ├── transfer.js        # 转账功能 API 端点
│   │       ├── mining.js          # 挖矿相关 API 端点
│   │       └── token.js           # 代币管理 API 端点
│   └── server.js                  # 服务器入口文件 - Fastify 应用配置
├── package.json                   # 依赖管理和脚本配置
└── README.md                      # 项目文档
```

## ✨ 核心功能模块

### 🔹 区块链核心（Core）

#### Blockchain.js - 区块链主控制器
```javascript
export class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;                    // 挖矿难度
        this.pendingTransactions = [];          // 待处理交易池
        this.miningReward = 100;               // 挖矿奖励
        this.totalSupply = 1000000;            // 总供应量
        this.circulatingSupply = 0;            // 流通供应量
    }
}
```

**核心业务逻辑**：
- **创世区块生成** - 自动创建包含初始供应量的创世区块
- **交易验证** - 验证交易合法性、余额充足性和签名有效性
- **挖矿控制** - 管理待处理交易的打包和挖矿奖励分发
- **余额计算** - 遍历区块链计算任意地址的代币余额
- **链式验证** - 完整性验证确保区块链数据不被篡改

#### Block.js - 区块数据结构
```javascript
export class Block {
    constructor(timestamp, transactions, previousHash = '') {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.nonce = 0;                         // 工作量证明随机数
        this.hash = this.calculateHash();      // SHA-256 哈希值
    }
}
```

**核心业务逻辑**：
- **哈希计算** - 使用 SHA-256 算法计算区块哈希值
- **工作量证明挖矿** - 通过调整 nonce 值找到符合难度要求的哈希
- **交易验证** - 验证区块内所有交易的有效性
- **数据序列化** - 提供 JSON 格式的数据导出

#### Transaction.js - 交易处理
```javascript
export class Transaction {
    constructor(fromAddress, toAddress, amount, type = 'transfer') {
        this.id = uuidv4();                     // 唯一交易ID
        this.fromAddress = fromAddress;         // 发送方地址
        this.toAddress = toAddress;             // 接收方地址
        this.amount = amount;                   // 交易金额
        this.type = type;                       // 交易类型
        this.timestamp = Date.now();            // 时间戳
        this.signature = null;                  // 数字签名
    }
}
```

**支持的交易类型**：
- **transfer** - 普通转账交易
- **mint** - 代币铸造交易
- **mine** - 挖矿奖励交易
- **burn** - 代币销毁交易

### 🔹 代币管理系统（TokenManager）

#### CosmoCoin (COSMO) 代币系统
```javascript
export class TokenManager {
    constructor(blockchain) {
        this.blockchain = blockchain;
        this.tokenName = 'CosmoCoin';           // 代币名称
        this.tokenSymbol = 'COSMO';             // 代币符号
    }
}
```

**核心功能**：
- **代币铸造** - 向指定地址铸造新的 COSMO 代币
- **代币销毁** - 从指定地址销毁 COSMO 代币
- **供应量管理** - 跟踪总供应量和流通供应量
- **余额查询** - 查询任意地址的代币余额
- **持有者统计** - 获取代币持有者排行榜和分布统计

**业务规则**：
- 铸造不能超过预设的总供应量限制
- 销毁必须验证地址余额充足
- 所有操作通过交易系统处理，确保可追溯性

### 🔹 钱包系统（Wallet）

#### 钱包生成和管理
```javascript
export class Wallet {
    constructor() {
        this.privateKey = this.generatePrivateKey();    // 32字节私钥
        this.publicKey = this.generatePublicKey();       // SHA-256公钥
        this.address = this.generateAddress();           // cosmo前缀地址
        this.id = uuidv4();                             // 钱包UUID
    }
}
```

**地址生成算法**：
1. 生成 32 字节随机私钥
2. 对私钥进行 SHA-256 哈希得到公钥
3. 对公钥进行 SHA-256 + RIPEMD-160 双重哈希
4. 添加 "cosmo" 前缀得到最终地址

**钱包管理器功能**：
- **批量管理** - 管理多个钱包实例
- **导入导出** - 支持钱包数据的安全导入导出
- **地址验证** - 验证钱包地址格式的正确性
- **余额查询** - 实时查询钱包代币余额

### 🔹 挖矿系统（MiningManager）

#### 矿工注册和挖矿控制
```javascript
export class MiningManager {
    constructor(blockchain, walletManager) {
        this.blockchain = blockchain;
        this.walletManager = walletManager;
        this.miners = new Map();                // 已注册矿工
        this.miningStats = new Map();           // 挖矿统计数据
        this.isMining = false;                  // 挖矿状态
        this.currentMiner = null;               // 当前矿工
    }
}
```

**挖矿业务流程**：
1. **矿工注册** - 验证钱包地址并注册矿工信息
2. **开始挖矿** - 检查待处理交易并启动挖矿进程
3. **工作量证明** - 模拟随机时间的挖矿过程（5-15秒）
4. **奖励分发** - 挖矿成功后自动分发 100 COSMO 奖励
5. **统计更新** - 更新矿工的挖矿统计数据

**挖矿限制**：
- 同一时间只能有一个矿工进行挖矿
- 必须有待处理交易才能开始挖矿
- 矿工必须先注册才能参与挖矿

## 📡 API 接口设计

### RESTful API 架构
所有 API 接口都遵循统一的响应格式：
```javascript
{
    "success": boolean,
    "data": object,
    "error": string,
    "message": string,
    "timestamp": string
}
```

### 核心 API 端点

#### 区块链相关 API（/api/blockchain）
```bash
GET /api/blockchain/info                    # 获取区块链基本信息
GET /api/blockchain/blocks                  # 获取区块列表（支持分页）
GET /api/blockchain/blocks/:hash            # 根据哈希获取区块详情
GET /api/blockchain/blocks/height/:height   # 根据高度获取区块详情
GET /api/blockchain/blocks/latest          # 获取最新区块
GET /api/blockchain/transactions           # 获取交易列表（支持筛选）
GET /api/blockchain/transactions/pending   # 获取待处理交易
GET /api/blockchain/validate              # 验证区块链完整性
```

#### 钱包管理 API（/api/wallets）
```bash
POST /api/wallets/create                   # 创建新钱包
GET  /api/wallets                          # 获取所有钱包列表
GET  /api/wallets/:address                 # 获取指定钱包信息
GET  /api/wallets/:address/balance         # 查询钱包余额
POST /api/wallets/import                   # 导入钱包（通过私钥）
POST /api/wallets/:address/export          # 导出钱包数据
DELETE /api/wallets/:address               # 删除钱包
```

#### 代币操作 API（/api/tokens）
```bash
GET  /api/tokens/info                      # 获取代币信息
POST /api/tokens/mint                      # 铸造代币
POST /api/tokens/burn                      # 销毁代币
GET  /api/tokens/balance/:address          # 查询代币余额
GET  /api/tokens/holders                   # 获取持有者列表
GET  /api/tokens/stats                     # 获取代币统计数据
```

#### 转账功能 API（/api/transfers）
```bash
POST /api/transfers                        # 创建转账交易
GET  /api/transfers/:address/history       # 获取交易历史
POST /api/transfers/estimate-fee           # 估算交易手续费
GET  /api/transfers/pending                # 获取待处理转账
```

#### 挖矿管理 API（/api/mining）
```bash
POST /api/mining/register                  # 注册矿工
POST /api/mining/start                     # 开始挖矿
POST /api/mining/stop                      # 停止挖矿
GET  /api/mining/status                    # 获取挖矿状态
GET  /api/mining/miners                    # 获取矿工列表
GET  /api/mining/miners/:address           # 获取指定矿工信息
GET  /api/mining/stats                     # 获取挖矿统计
DELETE /api/mining/:address                # 注销矿工
```

## 🔧 业务逻辑实现

### 交易处理流程
1. **交易创建** - 客户端发起转账请求
2. **余额验证** - 验证发送方余额是否充足
3. **交易签名** - 使用私钥对交易进行签名
4. **加入交易池** - 将有效交易加入待处理队列
5. **挖矿打包** - 矿工将交易打包进新区块
6. **工作量证明** - 完成挖矿算法找到有效哈希
7. **区块上链** - 将新区块添加到区块链
8. **余额更新** - 更新相关地址的余额状态

### 挖矿奖励机制
```javascript
// 挖矿奖励设置
const MINING_REWARD = 100;                  // 每个区块奖励 100 COSMO
const DIFFICULTY = 2;                       // 挖矿难度（哈希前导零个数）
const TARGET_BLOCK_TIME = 60000;            // 目标出块时间 1 分钟
```

**奖励分发逻辑**：
- 每当矿工成功挖出区块时自动获得 100 COSMO 奖励
- 奖励通过特殊的 "mine" 类型交易发放
- 奖励计入流通供应量，但不超过总供应量限制

### 安全性设计

#### 密码学安全
- **SHA-256 哈希** - 用于区块哈希和公钥生成
- **RIPEMD-160 哈希** - 用于钱包地址生成
- **HMAC 签名** - 用于交易签名验证
- **随机私钥** - 使用系统安全随机数生成器

#### 业务安全
- **双重验证** - 交易和区块都有独立的验证机制
- **余额检查** - 严格的余额验证防止重复支付
- **链完整性** - 定期验证整个区块链的完整性
- **地址格式** - 统一的地址格式和验证规则

## 🚀 快速开始

### 环境要求
- Node.js 16+
- pnpm 8+

### 安装和运行
```bash
# 安装依赖
pnpm install

# 启动开发服务器（热重载）
pnpm dev

# 启动生产服务器
pnpm start
```

### 服务器配置
```javascript
// 默认配置
const PORT = process.env.PORT || 3000;      // 服务端口
const HOST = process.env.HOST || '0.0.0.0'; // 监听地址
```

服务器启动后将在 `http://localhost:3000` 提供服务

### 初始化数据
服务器启动时自动执行：
1. 创建创世区块（包含 1,000,000 COSMO 总供应量）
2. 生成两个测试钱包
3. 注册一个测试矿工
4. 启动所有 API 服务

## 💡 使用示例

### 创建钱包
```bash
curl -X POST http://localhost:3000/api/wallets/create
```

### 铸造代币
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"toAddress": "cosmo...", "amount": 1000}' \
  http://localhost:3000/api/tokens/mint
```

### 发起转账
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"fromAddress": "cosmo...", "toAddress": "cosmo...", "amount": 100}' \
  http://localhost:3000/api/transfers
```

### 注册矿工
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"minerAddress": "cosmo...", "minerName": "My Miner"}' \
  http://localhost:3000/api/mining/register
```

### 开始挖矿
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"minerAddress": "cosmo..."}' \
  http://localhost:3000/api/mining/start
```

## 📊 数据模型

### 区块数据结构
```javascript
{
    "timestamp": 1640995200000,
    "transactions": [...],
    "previousHash": "0000abc...",
    "nonce": 12345,
    "hash": "0000def..."
}
```

### 交易数据结构
```javascript
{
    "id": "uuid-v4",
    "fromAddress": "cosmo1abc...",
    "toAddress": "cosmo1def...",
    "amount": 100,
    "type": "transfer",
    "timestamp": 1640995200000,
    "signature": "hex-string"
}
```

### 钱包数据结构
```javascript
{
    "id": "uuid-v4",
    "address": "cosmo1abc...",
    "publicKey": "hex-string",
    "balance": 1000.50
}
```

## 🔄 开发和调试

### 日志系统
服务器使用 Fastify 内置日志系统，提供详细的请求和错误日志：
```javascript
// 日志级别
fastify.log.info('Block mined successfully');
fastify.log.error('Mining failed:', error);
fastify.log.debug('Transaction validated');
```

### 错误处理
统一的错误处理机制：
```javascript
fastify.setErrorHandler(async (error, request, reply) => {
    fastify.log.error(error);
    reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});
```

### 健康检查
```bash
# 服务器健康检查
curl http://localhost:3000/health

# API 状态检查
curl http://localhost:3000/
```

## 📈 性能和监控

### 系统性能指标
- **区块生成时间** - 平均 5-15 秒（模拟挖矿）
- **交易处理能力** - 每区块可包含无限交易
- **API 响应时间** - 平均 < 100ms
- **内存使用** - 完整区块链数据存储在内存中

### 挖矿统计
- 总注册矿工数量
- 活跃矿工数量
- 已挖出区块总数
- 已分发奖励总数
- 网络哈希率统计
- 平均出块时间

## 🛣️ 未来规划

### 短期目标
- [ ] 实现数据持久化存储
- [ ] 添加交易手续费机制
- [ ] 优化挖矿算法性能
- [ ] 增加更多安全验证

### 长期目标
- [ ] 实现分布式节点网络
- [ ] 支持智能合约功能
- [ ] 添加多签钱包支持
- [ ] 集成外部数据库存储

## 🔒 安全注意事项

1. **私钥安全** - 私钥仅在导出时显示，生产环境需加密存储
2. **交易签名** - 所有交易都需要有效的数字签名
3. **余额验证** - 严格验证转账前的余额充足性
4. **输入验证** - 所有 API 输入都进行格式和类型验证
5. **CORS 安全** - 正确配置跨域访问策略

---

**Chain Cosmos Server** - 现代化区块链后端服务 ⛏️
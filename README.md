Genaro Share Daemon
==================

Daemon + CLI for farming data on the Genaro network, suitable for standalone
use or inclusion in other packages.

中文说明请往下滚动看下半部分

## Manual Installation

Make sure you have the following prerequisites installed:

* Git
* Node.js LTS (8.x.x)
* NPM
* Python 2.7
* GCC/G++/Make

### Node.js + NPM

#### GNU+Linux & Mac OSX

```
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
```

Close your shell and open an new one. Now that you can call the `nvm` program,
install Node.js (which comes with NPM):

```
nvm install --lts
```

#### Windows

Download [Node.js LTS](https://nodejs.org/en/download/) for Windows, launch the
installer and follow the setup instructions. Restart your PC, then test it from
the command prompt:

```
node --version
npm --version
```

### Build Dependencies

#### GNU+Linux

Debian based (like Ubuntu)
```
apt install git python build-essential
```

Red Hat / Centos
```
yum groupinstall 'Development Tools'
```
You might also find yourself lacking a C++11 compiler - [see this](http://hiltmon.com/blog/2015/08/09/c-plus-plus-11-on-centos-6-dot-6/)

#### Mac OSX

```
xcode-select --install
```

#### Windows

```
npm install --global windows-build-tools
```

---

Once build dependencies have been installed for your platform, install the
package globally using Node Package Manager:

```
npm install --global genaroshare-daemon
```

## Usage (CLI)

Once installed, you will have access to the `genaroshare` program, so start by
asking it for some help.

```
genaroshare --help

  Usage: genaroshare [options] [command]


  Commands:

    start          start a farming node
    stake          stake the farming node
    addNodes       add storage nodes
    stop           stop a farming node
    restart        restart a farming node
    status         check status of node(s)
    logs           tail the logs for a node
    create         create a new configuration
    destroy        kills the farming node
    killall        kills all shares and stops the daemon
    createWallet   create a new wallet
    listWallets    list wallets
    deleteWallet   delete wallet
    daemon         starts the daemon
    help [cmd]     display help for [cmd]

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```

You can also get more detailed help for a specific command.

```
genaroshare help create

  Usage: genaroshare-create [options]

  generates a new share configuration

  Options:

    --name <name>              specify the account name(required)
    --password <password>      specify the account password(required)
    --key <privkey>            specify the private key
    --storage <path>           specify the storage path
    --size <maxsize>           specify node size (ex: 10GB, 1TB)
    --rpcport <port>           specify the rpc port number
    --rpcaddress <addr>        specify the rpc address
    --maxtunnels <tunnels>     specify the max tunnels
    --tunnelportmin <port>     specify min gateway port
    --tunnelportmax <port>     specify max gateway port
    --manualforwarding         do not use nat traversal strategies
    --verbosity <verbosity>    specify the logger verbosity
    --logdir <path>            specify the log directory
    --noedit                   do not open generated config in editor
    -o, --outfile <writepath>  write config to path
    -h, --help                 output usage information

    -o, --outfile <writepath>  write config to path
```

## Configuring the Daemon

The Genaro Share daemon loads configuration from anywhere the
[rc](https://www.npmjs.com/package/rc) package can read it. The first time you
run the daemon, it will create a directory in `$HOME/.config/genaroshare`, so
the simplest way to change the daemon's behavior is to create a file at
`$HOME/.config/genaroshare/config` containing the following:

```json
{
  "daemonRpcPort": 45016,
  "daemonRpcAddress": "127.0.0.1",
  "daemonLogFilePath": "",
  "daemonLogVerbosity": 3
}
```

Modify these parameters to your liking, see `example/daemon.config.json` for
detailed explanation of these properties.

## Debugging the Daemon

The daemon logs activity to the configured log file, which by default is
`$HOME/.config/genaroshare/logs/daemon.log`. However if you find yourself
needing to frequently restart the daemon and check the logs during
development, you can run the daemon as a foreground process for a tighter
feedback loop.

```
genaroshare killall
genaroshare daemon --foreground
```

#### Updating genaroshare and restoring sessions

If you want to upgrade genaroshare you can save your current session and
reload it after updating

```
genaroshare save
genaroshare killall
npm install -g genaroshare-daemon
genaroshare daemon &
genaroshare load
```

中文说明
==================

Daemon + CLI 是在 Genaro Network 上面 farming 的软件, 可以独立使用，也可以用在其他的软件中.

## 手动安装

确保您已安装以下依赖:

* Git
* Node.js LTS (8.x.x)
* NPM
* Python 2.7
* GCC/G++/Make

### Node.js + NPM

#### GNU+Linux & Mac OSX

```
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
```

关闭你的控制台，然后新开一个控制台. 现在您可以调用 `nvm` 程序
安装 Node.js (与 NPM 在一起):

```
nvm install --lts
```

#### Windows

下载 [Node.js LTS](https://nodejs.org/en/download/) 的 Windows 版本, 打开安装文件，然后按照提示进行. 重启您的电脑, 然后用以下命令测试:

```
node --version
npm --version
```

### 编译依赖项

#### GNU+Linux

基于 Debian (例如 Ubuntu)
```
apt install git python build-essential
```

Red Hat / Centos
```
yum groupinstall 'Development Tools'
```
您也许发现需要一个 c++ 11 的编译器 - [请看这里](http://hiltmon.com/blog/2015/08/09/c-plus-plus-11-on-centos-6-dot-6/)

#### Mac OSX

```
xcode-select --install
```

#### Windows

```
npm install --global windows-build-tools
```

---

一旦编译依赖项在您的平台上安装成功, 全局安装下面的软件包:

```
npm install --global genaroshare-daemon
```

## 使用方式 (命令行)

一旦安装成功, 您就可以使用 `genaroshare` 程序, 可以以帮助开始.

```
genaroshare --help

  Usage: genaroshare [options] [command]


  Commands:

    start          start a farming node
    stake          stake the farming node
    addNodes       add storage nodes
    stop           stop a farming node
    restart        restart a farming node
    status         check status of node(s)
    logs           tail the logs for a node
    create         create a new configuration
    destroy        kills the farming node
    killall        kills all shares and stops the daemon
    createWallet   create a new wallet
    listWallets    list wallets
    deleteWallet   delete wallet
    daemon         starts the daemon
    help [cmd]     display help for [cmd]

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```

您也可以获得某个特定命令的详细帮助

```
genaroshare help create

  Usage: genaroshare-create [options]

  generates a new share configuration

  Options:

    --key <privkey>            specify the private key
    --storage <path>           specify the storage path
    --size <maxsize>           specify node size (ex: 10GB, 1TB)
    --rpcport <port>           specify the rpc port number
    --rpcaddress <addr>        specify the rpc address
    --maxtunnels <tunnels>     specify the max tunnels
    --tunnelportmin <port>     specify min gateway port
    --tunnelportmax <port>     specify max gateway port
    --manualforwarding         do not use nat traversal strategies
    --verbosity <verbosity>    specify the logger verbosity
    --logdir <path>            specify the log directory
    --noedit                   do not open generated config in editor
    -o, --outfile <writepath>  write config to path
    -h, --help                 output usage information

```

## 配置 Daemon

Genaro Share daemon 载入配置文件从任何
[rc](https://www.npmjs.com/package/rc) 软件可以读取的地方. 首次运行时, 他将在目录 `$HOME/.config/genaroshare` 新建文件夹, 所以改变 daemon 行为的最简单的方式是再如下目录新建一个文件`$HOME/.config/genaroshare/config`，包含以下内容：

```json
{
  "daemonRpcPort": 45016,
  "daemonRpcAddress": "127.0.0.1",
  "daemonLogFilePath": "",
  "daemonLogVerbosity": 3
}
```

按照您的兴趣修改上面的参数, 查看 `example/daemon.config.json` 文件以获取详细说明。

## 调试 Daemon

daemon 会记录日志至日志文件, 默认为
`$HOME/.config/genaroshare/logs/daemon.log`. 然而如果您发现需要经常重启并查看日志的话，您可以将 daemon 启动在前台，以获得即时反馈。

```
genaroshare killall
genaroshare daemon --foreground
```
#### 更新 genaroshare 恢复会话

如果您需要升级 genaroshare 可以先保存会话并在升级后重新载入会话

```
genaroshare save
genaroshare killall
npm install -g genaroshare-daemon
genaroshare daemon &
genaroshare load
```

## farming 基本步骤
在安装 genaroshare 完成后需要做以下操作开始分享硬盘
1. 创建配置文件: genaroshare-create 。完成后输出配置文件路径。
2. 按照需求，修改创建好的配置文件
3. 使用genaroshare-stake开始stake自己的钱包。完成后会获得一个txhash。
4. 使用genaroshare-addNodes将刚才创建的节点添加到自己的钱包下。完成后会获得一个txhash
5. 开启 daemon: genaroshare-daemon
6. 开始 farming: genaroshare-start -c <配置文件路径>
7. 查看分享状态 genaroshare-status

# FAQ

- 为什么需要 stake，我不 stake 能否用 sharer 分享?

stake 行为的目的在于提高矿工们开启分享节点的积极性，尽可能保证大部分节点能够长期有效在线的机制。不进行stake也能进行分享，但是在不stake的情况下，无法使用addNodes将节点和钱包地址绑定来获取收益。

- Stake 的 GNX 可以取出来吗？

Stake 时，除了设置 GNX 押注量之外。押注的这一部分 GNX 在退注前将无法使用。
    
- 什么是公网 ip ，没有公网 ip 是否能分享?

IP 地址即 Internet Protocol Address，公网 IP 地址是任何接入 Internet 的设备都可以访问的 IP 地址，在 Internet 中是全球唯一的。所谓公网是 Internet 的接入方式，使得上网的计算机得到的IP地址是 Internet 上的非保留地址，公网的计算机和 Internet 上的其他计算机可以随意互相访问。对于家庭网络用户来说，你的 ISP (网络运营商，例如中国电信，联通等) 负责分配给你 IP，但是这个 IP 还不一定是公网 IP，需要到拨号的设备（一般是路由器，也有可能是路由器和 modern 二合一的设备）检查，如果不是公网 IP 那么您可以与你的 ISP 沟通。如果你运行 genaro sharer 的设备没有公网 IP 而路由器有，可以启用路由器的 Upnp 功能，或者自行设置端口转发，这样也同样可以分享。

- 发现 sharer 运行问题怎么办？
  - 可以自查原因，检查所使用的 sharer 是否是最新版本；或可通过sharer提示的错误，排查由于网络或计算机本身导致的 sharer 运行不正常的原因；
  - 通过社区咨询解决方案；加入微信群请加微信管理员：imairei6221217 注明 Genaro Sharer 问题。
  - 向 genaro 官方反馈问题，反馈问题是请提供计算机系统、版本、sharer 版本、问题现象、错误提示、日志等信息；邮件 eden@genaro.network

- Linux 环境下的 genaroshare 是否能导入已经存在的钱包。如想把 IMtoken 钱包导入到 genaroshare 中?

Linux 现在没有这个功能，Windows/Mac 的 GUI 版本可以。这个功能我们已经加入待开发列表。

- 我可以用 NAS 设备运行 Sharer 吗？

取决于你的 NAS 设备的配置，操作系统等。一般来说是可以的，但是 Genaro 团队没有测试所有型号的 NAS，不保证可以运行。另外操作 NAS 需要一定的技术基础，至少要熟悉 Linux 命令行(大部分 NAS 都是 linux 系统)，以及配置操作系统的 ip ，能够解决 Node 安装，编译时会遇到的各种问题。由于 NAS 品牌设备种类多，Genaro 团队不会对 NAS 设备的运行做专门的技术支持。

- 节点配置问题，团队能否推荐好的节点配置？nas 做节点效率高还是电脑磁盘阵列效率高？

对于磁盘没有很高的要求。通常情况下能否获得更多的分享取决于你的网络连接是否够快，与上传文件的用户的链接是否够快。以及是否持续稳定在线。

- 某些列不同的颜色都表示什么样的状态？

Status/状态：

灰色：stopped，未开启；

绿色：running，正常运行；

红色：errored，出错；


Delta/延迟：

绿色：延迟在500以内；

红色：延迟超过500；


Port/端口：

绿色：非私网IP，且根据配置文件中的rpcAddress和rpcPort可成功建立socket连接；

黄色：无法直接接受用户文件，但成功进行tunnel连接，可通过tunnel接受到文件；

红色：配置文件中doNotTraverseNat（不进行Nat穿透）配置为true且不是公网IP；


Bridges/桥接：

灰色：disconnected，未连接；

黄色：connecting，正在连接中；

橙色：confirming，验证用户中；

绿色：connected，正常连接；
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

    start       start a farming node
    stake       stake the farming node
    stop        stop a farming node
    restart     restart a farming node
    status      check status of node(s)
    logs        tail the logs for a node
    create      create a new configuration
    destroy     kills the farming node
    killall     kills all shares and stops the daemon
    daemon      starts the daemon
    help [cmd]  display help for [cmd]

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
  "daemonRpcPort": 45015,
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

Daemon + CLI 是在 Genaroi Network 上面 farming 的软件, 可以独立使用，也可以用在其他的软件中.

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

    start       start a farming node
    stake       stake the farming node    
    stop        stop a farming node
    restart     restart a farming node
    status      check status of node(s)
    logs        tail the logs for a node
    create      create a new configuration
    destroy     kills the farming node
    killall     kills all shares and stops the daemon
    daemon      starts the daemon
    help [cmd]  display help for [cmd]

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

```

## 配置 Daemon

Genaro Share daemon 载入配置文件从任何
[rc](https://www.npmjs.com/package/rc) 软件可以读取的地方. 首次运行时, 他将在目录 `$HOME/.config/genaroshare` 新建文件夹, 所以改变 daemon 行为的最简单的方式是再如下目录新建一个文件`$HOME/.config/genaroshare/config`，包含以下内容：

```json
{
  "daemonRpcPort": 45015,
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
3. 使用genaroshare-stake开始stake自己的nodeid。完成后会获得一个txhash。
4. 开启 daemon: genaroshare-daemon
5. 开始 farming: genaroshare-start -c <配置文件路径>
6. 查看分享状态 genaroshare-status
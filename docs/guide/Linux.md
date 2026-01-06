# Linux

## 通用命令

### 查看端口  

```sh
netstat -tunlp | grep 8080
```
### 查看进程
```sh
# aux 还能看到cpu, 内存的瞬时使用情况
ps -aux | grep xxx.jar
ps -ef  | grep xxx.jar
```
### 查看资源使用情况
```sh
top
# 按下大M(shift+m)可以按内存使用率排序
```
### 杀死进程

```sh
kill -9 pid
```
### 解压缩

```sh
tar -xvf
```

### 查看文件的3种命令

```sh
vi xxx
cat xxx
tail -f xxx
```

### 后台运行程序

```sh
# nohub 后台运行，输出到 magic.log
nohup java -jar magic-0.0.1-SNAPSHOT.jar > magic.log 2>&1 &
# 如果不需要重定向输出控制台内容到文件，可以改为 /dev/null
nohup java -jar magic-0.0.1-SNAPSHOT.jar > /dev/null 2>&1 &
```

## CentOS

### 设置默认启动方式

```shell
#查看默认启动方式是什么，如果显示multi-user.target， 说明是默认命令行启动
systemctl get-default
#设置开机默认图形桌面启动
systemctl  set-default graphical.target
#设置开机默认命令行启动
systemctl  set-default multi-user.target
```

### 设置静态IP

```shell
# ens33不是固定的，用ifconfig查看
vim /etc/sysconfig/network-scripts/ifcfg-ens33

# 修改以下配置
BOOTPROTO=static
DNBOOT=yes
IPADDR=192.168.0.8
NETMASK=255.255.255.0
GATEWAY=192.168.0.1
DNS1=192.168.0.1

# 重启网络
service network restart
```

### 开启/关闭防火墙

```shell
# 查看防火墙状态
firewall-cmd --state
# 关闭防火墙
systemctl stop firewalld.service
# 关闭防火墙自启动
systemctl disable firewalld.service
```


# Emby 伪站破解认证

创建 CA 根证书私钥
```shell
openssl genrsa -out ca.key 4096
```

用私钥生成 CA 根证书
```shell
openssl req -x509 -new -key ca.key -days 3650 -sha256 \
-subj "/C=JP/ST=Japan/L=Japan/O=Emby/CN=Emby-Root-CA" \
-out ca.pem
```

创建服务器证书私钥（mb3admin.com）
```shell
openssl genrsa -out ssl.key 2048
```

创建 SAN 配置文件（非常关键）openssl-san.cnf
```shell
[ req ]
default_bits       = 2048
prompt             = no
default_md         = sha256
distinguished_name = dn
req_extensions     = req_ext

[ dn ]
C  = JP
ST = Japan
L  = Japan
O  = Emby
CN = mb3admin.com

[ req_ext ]
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = mb3admin.com
DNS.2 = *.mb3admin.com
```

生成 CSR 中间文件（签名请求）
```shell
openssl req -new -key ssl.key -out ssl.csr -config openssl-san.cnf
```

用 CA 根证书签名服务器 ssl 证书
```shell
openssl x509 -req \
-in ssl.csr \
-CA ca.pem \
-CAkey ca.key \
-CAcreateserial \
-out ssl.crt \
-days 825 \
-sha256 \
-extfile openssl-san.cnf \
-extensions req_ext
```

::: tip
让浏览器/客户端信任，要把根证书ca.pem导入各系统，若不导入Emby客户端会弹窗让你选择是否信任该证书  
Windows：安装到受信任的根证书颁发机构，windows下复制ca.pem重命名为ca.crt直接双击安装  
Android：安全 > 用户凭据  
iOS：描述文件 / 设置 → 通用 → 关于 → 证书信任
:::

Linux：复制证书到 /usr/local/share/ca-certificates/ 文件下并更新证书 
```shell
sudo cp ca.crt /usr/local/share/ca-certificates/ca.pem 
sudo update-ca-certificates
```

::: warning
上面一切的前提是要重定向`mb3admin.com`到指定ip
:::
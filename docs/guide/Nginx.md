# Nginx

## 负载均衡策略

- 加权轮询：可以给每台机器加一个权重，权重高的就访问的比较多些。
- ip hash：同一个IP的请求永远打在同一台服务器上。
- fair：根据后端服务器响应的时间判断负载情况，选择负载最轻的那台服务器。
- 通用hash
- 一致性hash





***



# Nginx使用及配置

> Nginx的配置文件在根目录下的 `conf.d` 目录下，默认会有一个 `default.conf` 配置文件。         
## Nginx配置域名

```bash
server {

    listen       80;
    listen  [::]:80;

    # 配置域名
    server_name  www.xxxxx.site;

    location / {
        # return 404;  直接返回404（不想让人访问其他内容时）
        root   /usr/share/nginx/html; #页面文件根目录
        index  index.html index.htm;  #主页面
    }

    # 匹配请求前缀进行转发（不用做代理时不需要）
    location /api {
        proxy_pass http://xxxxx.site:8000/ms;
    }

    # redirect server error pages to the static page /50x.html
    # 重定向各种错误页面
    error_page   404 500 502 503 504  /404.html;
    location = /404.html {
        root   /usr/share/nginx/html;
    }

}
```
## Nginx配置二级域名
> 举个栗子：  
比如：`fs3f.xxxxx.site`  
在配置文件目录 `conf.d` 下新建配置文件 `fs3f.conf`

```bash
server {
    listen       80;
    listen  [::]:80;

    # 域名要配置成二级域名
    server_name  fs3f.xxxxx.site;

    location / {
        root   /usr/share/nginx/html/fs3f; #二级页面文件根目录
        index  index.html index.htm;
    }

    # redirect server error pages to the static page /50x.html

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
```
## Nginx配置 SSL，即 https
> 在 `conf.d` 目录下新建文件夹 `cert` 用于存放ssl证书和公钥，文件夹名称随意都可以。  
证书是拓展名为`pem`的文件（我是阿里云的）  
公钥是拓展名为`key`的文件  
然后把证书和公钥复制到`cert`文件夹下。  
在对应的配置文件 `default.conf` 加入SSL有关配置：
```bash
server {

    #listen       80;
    #listen  [::]:80;
    #server_name  www.xxxxx.com;

    listen  443 ssl;
    server_name  www.xxxxx.com;
    ssl_certificate            /etc/nginx/conf.d/cert/xxxxx.pem;
    ssl_certificate_key        /etc/nginx/conf.d/cert/xxxxx.key;
    ssl_session_cache          shared:SSL:1m;
    ssl_session_timeout        5m;
    ssl_ciphers                HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers  on;
    
    # 为 magic_server做反向代理
    location /magic {
        proxy_pass          http://172.17.21.170:8888/magic/;
        #proxy_set_header    Host $proxy_host;
    }

    location / {
         root   /usr/share/nginx/html;
         try_files $uri $uri/ /index.html; #防止刷新404
         index  index.html index.htm;
    }

    # redirect server error pages to the static page /50x.html
    #
    error_page   404 500 502 503 504  /404.html;
    location = /404.html {
        root   /usr/share/nginx/html;
    }

}
```

## 反向代理

### 代理效果示例一：

请求：

```apl
http://127.0.0.1/api/gbhome/findPage?current=1&size=10
```

代理配置：

```bash
location /api {
    proxy_pass  http://192.168.0.5:8080;
}
```

代理效果：（直接拼接）

```apl
http://192.168.0.5:8080/api/gbhome/findPage?current=1&size=10
```

### 反向代理示例二

请求：

```apl
http://127.0.0.1/api/gbhome/findPage?current=1&size=10
```

代理配置：

```bash
location /api {
	# 此处配置的端口后面的路径有替换拦截路径的效果，即 aaa 会替换掉 api
    proxy_pass http://192.168.0.5:8080/aaa;
}
```

代理效果：（替换前缀）

```apl
http://192.168.0.5:8080/aaa/gbhome/findPage?current=1&size=10
```

# Nginx配置文件实例

```properties
# For more information on configuration, see:
#   * Official English Documentation: http://nginx.org/en/docs/
#   * Official Russian Documentation: http://nginx.org/ru/docs/

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

# Load dynamic modules. See /usr/share/doc/nginx/README.dynamic.
include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 4096;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    include /etc/nginx/conf.d/*.conf;

    # server {
    #     listen       80;
    #     server_name  www.gkdcc.asia;
        

    #     # Load configuration files for the default server block.
    #     include /etc/nginx/default.d/*.conf;

    #     location /spider {
    #        proxy_pass http://127.0.0.1:5601;
    #        proxy_set_header Host $host;                #转发当前本地主机名称
    #        proxy_set_header Port $proxy_port;          #转发被代理的端口到后端服务器
    #        proxy_set_header X-Real-IP $remote_addr;    #转发远程客户端地址到后端服务器
    #        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; ##通过X-Forwardel-For方式将客户端的真实IP地址转发
    #    }

    #    location / {
    #        root         /usr/share/nginx/html;
    #        index        index.html;
    #    }

    #     # error_page 404 /404.html;
    #     location = /404.html {
    #     }

    #     # error_page 500 502 503 504 /50x.html;
    #     location = /50x.html {
    #     }
    # }


    # server {
    #     listen       443 ssl http2;
    #     server_name  www.gkdcc.asia;
    #     root         /usr/share/nginx/html;

    #     ssl_certificate "/etc/pki/nginx/gkdcc.asia.pem";
    #     ssl_certificate_key "/etc/pki/nginx/gkdcc.asia.key";
    #     ssl_session_cache shared:SSL:1m;
    #     ssl_session_timeout  10m;
    #     ssl_ciphers HIGH:!aNULL:!MD5;
    #     ssl_prefer_server_ciphers on;

    #     # Load configuration files for the default server block.
    #     include /etc/nginx/default.d/*.conf;

    #     location /spider {
    #         proxy_pass http://127.0.0.1:5601;
    #         proxy_set_header Host $host;                #转发当前本地主机名称
    #         proxy_set_header Port $proxy_port;          #转发被代理的端口到后端服务器
    #         proxy_set_header X-Real-IP $remote_addr;    #转发远程客户端地址到后端服务器
    #         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; ##通过X-Forwardel-For方式将客户端的真实IP地址转发
    #     }

    #     error_page 404 /404.html;
    #         location = /40x.html {
    #     }

    #     error_page 500 502 503 504 /50x.html;
    #         location = /50x.html {
    #     }
    # }

    #配置负载均衡池

    #portainer负载均衡池
    upstream portainer_pool{
        server 127.0.0.1:6900;
    }

    #ql负载均衡池
    upstream ql_pool{
        server 127.0.0.1:3700;
    }

    #一级域名
    server {
        listen       6443 ssl;
        server_name  www.hbocc.top;

        ssl_certificate "/etc/pki/nginx/hbocc.top_bundle.crt";
        ssl_certificate_key "/etc/pki/nginx/hbocc.top.key";
        ssl_session_cache shared:SSL:1m;
        ssl_session_timeout  10m;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        
        location / {
            root         /usr/share/nginx/html;
            index        404.html;
        }
    }

    #二级域名
    server {
        listen       6443 ssl;
        server_name  docker.hbocc.top;

        ssl_certificate "/etc/pki/nginx/docker.hbocc.top_bundle.crt";
        ssl_certificate_key "/etc/pki/nginx/docker.hbocc.top.key";
        ssl_session_cache shared:SSL:1m;
        ssl_session_timeout  10m;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        
        #将所有请求转发给demo_pool池的应用处理
        location / {
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_pass http://portainer_pool;
        }
    }

    #二级域名
    server {
        listen       6443 ssl;
        server_name  ql.hbocc.top;

        ssl_certificate "/etc/pki/nginx/ql.hbocc.top_bundle.crt";
        ssl_certificate_key "/etc/pki/nginx/ql.hbocc.top.key";
        ssl_session_cache shared:SSL:1m;
        ssl_session_timeout  10m;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        
        #将所有请求转发给demo_pool池的应用处理
        location / {
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_pass http://ql_pool;
        }
    }


}


```


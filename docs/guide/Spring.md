# Spring

**IOC控制反转**

概念：把对Bean的控制权交给Spring容器。

## 循环依赖

Spring Bean的循环依赖是通过三级缓存解决的。

假设有A、B、C三个bean，A引用B，B引用C，C引用A，spring就根据依赖关系把它们全都放到三级缓存里面，当创建C想把A注入到C里面的时候，发现A还在创建当中，一级缓存里面没有A，然后就从三级缓存里通过A的工厂获取A实例，把A实例提到二级缓存中，直接就把这个还没初始化的A注入到C当中，这样C就完成初始化了，然后把C提到一级缓存中，然后继续把C注入给B，把B注入回给A，这样就完成了ABC的初始化，这就是spring创建循环依赖的Bean的过程。

**各级缓存的区别**

- **singletonObjects：** 一级缓存，存储单例对象，Bean 已经实例化，初始化完成。

- **earlySingletonObjects：** 二级缓存，存储 singletonObject，这个 Bean 实例化了，还没有初始化。

- **singletonFactories：** 三级缓存，存储 singletonFactory。

## Bean的作用域

| 作用域    | 描述                                               |
| --------- | -------------------------------------------------- |
| singleton | 以单例的形式存在，只有一个bean                     |
| prototype | 多实例，每次调用getBean()时会返回一个新的实例      |
| request   | 每次HTTP请求都创建一个新的bean                     |
| session   | 一个session共用一个bean。不同session使用不同的bean |

## Bean的生命周期

1. 创建实例
2. 属性赋值
3. 初始化
4. bean正常使用
5. 容器关闭，bean销毁

**单实例和多实例的不同**

单实例下 bean 的生命周期：

容器启动——>初始化方法——>（容器关闭）销毁方法

多实例下 bean 的生命周期：

容器启动——>调用 bean——>初始化方法——>容器关闭（销毁方法不执行）

**Bean属性的注入方式**

- 构造方法注入
- setter方法注入

## 事务传播机制

在Spring事务管理当中，对调用链中的子方法的事务处理策略叫做事务传播行为，也叫事务传播机制。

事务传播机制基本上就分为这3类：

- 优先使用当前事务
- 不适用当前事务，开启新的事务
- 不使用任何事务

## 使用到的部分设计模式

创建Bean的时候使用了**单例模式、工厂设计模式**

AOP用到**代理模式、适配器模式（功能增强和通知）**

spring事务管理也是用到了**代理模式**

## Spring事务

#### spring事务的实现方式和原理以及隔离级别


 事务是数据库层面的,spring只是基于数据库事务进行扩展

 spring框架中有两种使用事务的方式  ->  **申明式 与 编程式** (注解@Transaction 是属于申明式)

 spring事务隔离级别
 read uncommitted -> 读未提交
 read committed   -> 提交读、不可重复读
 repeatable read  -> 可重复读
 serializable     -> 可串行化

 mysql 默认的隔离级别是 可重复读(repeatable read) 
 Oracle，SqlServer中都是选择读已提交(Read committed)


@Transaction
spring会基于这个类生成一个代理对象,会将这个代理对象作为一个bean 使用这个代理对象的方法.
方法上存在transaction 注解 那么代理逻辑会先把事务的自动提交设置为false,然后再去执行原本业务逻辑方法,如果没有出现异常那么代理逻辑中就会将事务进行提交 如果执行业务中出现异常则会进行事务回滚。
默认会对 RuntimeException 和 Error 进行回滚  
可以使用rollback 属性进行配置


数据库配置的隔离级别是 Read committed 而spring配置的隔离级别是 repeatable read 这个时候以spring配置的为准,如果spring设置的隔离级别数据库不支持效果取决于数据库。

----------------------------------------------------------

spring事务传播机制

Required       如果当前没有事务，则自己新建一个事务，如果当前存在事务则加入这个事务 （默认）
Supports       当前存在事务则加入当前事务,如果当前没有事务,就以非事务方式执行
Mandatory      当前存在事务则加入当前事务,如果当前没有事务就以非事务方法执行
never          不适用事务,如果当前事务存在,则抛出异常
nested         如果当前事务存在,则在嵌套事务中执行,否则Required的操作一样(开启一个事务)
Requires_new   创建一个新事务,如果当前存在事务,则挂起该事务
Not_supported  以非事务方式执行,如果当前存在事务,则挂起当前事务

----------------------------------------------------------

spring事务什么时候会失效

spring事务原理就是AOP 进行切面增强,多数情况下原因是这个切面不生效了


1 类内部自身调用,类里面使用this调用本类的方法(this 通常省略), 此时这个this对象不是代理类,而是本身所以不生效(解决: 将当前调用方法变成代理类)

2 方法不是public  事务@Transaction 只能用于public方法上 (事务本身就为了提供外部调用)

3 数据库不支持

4 没有被spring管理

5 异常捕获或者是抛出异常没有被定义,默认为runtimeException
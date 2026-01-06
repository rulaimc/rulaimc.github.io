# JVM (黑马)

## 程序计数器

程序计数器对应的物理储存位置是CPU寄存器，计数器记录着当前线程下一条要执行的JVM指令的地址。

> 特点：线程私有、没有内存溢出



## 虚拟机栈

- 一个虚拟机栈对应一个线程运行的内存。
- 栈里面包含多个栈帧，每个栈帧对应每个方法调用所占用的内存，栈帧包含有参数、局部变量、返回地址、对象的引用等内容。
- 每个线程就是每个栈只能有一个活动的栈帧，对应着当前正在执行的那个方法。



## 线程诊断

排查出哪个线程占用cpu过高

```bash
#通过进程id查出线程id（tid）
ps H -eo pid,tid,%cpu|grep 进程id

#打印进程下的所有线程的信息，找到对应的线程查看（16进制），找出问题对应的代码类名和  行号，还能查看死锁
jstack 进程id
```



## 堆



```shell
#查看所有Java进程id
jps

#某个时刻堆内存使用状况
jmap -heap 进程id
```

> 堆检查工具常用的有 jconsole， jvisualVM等。jvisualvm可以把堆内存dump下来，找出较大的对象。



## StringTable（常量池）

- 常量池中的字符串仅是符号，第一次用到时才变为对象

- 字符串变量拼接的原理是StringBuilder

- 字符串常量拼接的原理是编译器优化

- 可以使用`intern()`方法主动将常量池中还没有的字符串放入常量池，如果常量池中已经有了，就会入池失败，如果没有，入池成功，返回字符串在常量池中的地址。

> jdk1.6 常量池在方法区-->永久代中
>
> jdk1.7以上 常量池在堆内存中

### 常量池调优

- 调整 `-XX:StringTableSize=哈希桶个数`，桶数越多，哈希碰撞几率越小，操作越快。
- 有大量重复字符串的时候，使用 `intern()` 方法主动入池，减少内存消耗。







## 什么是JVM

### 定义

Java Virtual Machine，JAVA程序的**运行环境**（JAVA二进制字节码的运行环境）

### 好处

- 一次编写，到处运行
- 自动内存管理，垃圾回收机制
- 数组下标越界检查

### 比较

JVM JRE JDK的区别

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150422.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150422.png)

## 二、内存结构

### **整体架构**

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150440.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150440.png)

### 1、程序计数器

#### 作用

用于保存JVM中下一条所要执行的指令的地址

#### 特点

- 线程私有
  - CPU会为每个线程分配时间片，当当前线程的时间片使用完以后，CPU就会去执行另一个线程中的代码
  - 程序计数器是**每个线程**所**私有**的，当另一个线程的时间片用完，又返回来执行当前线程的代码时，通过程序计数器可以知道应该执行哪一句指令
- 不会存在内存溢出

### 2、虚拟机栈

#### 定义

- 每个**线程**运行需要的内存空间，称为**虚拟机栈**
- 每个栈由多个**栈帧**组成，对应着每次调用方法时所占用的内存
- 每个线程只能有**一个活动栈帧**，对应着**当前正在执行的方法**

#### 演示

代码

```java
public class Main {
	public static void main(String[] args) {
		method1();
	}

	private static void method1() {
		method2(1, 2);
	}

	private static int method2(int a, int b) {
		int c = a + b;
		return c;
	}
}
```

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150534.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150534.png)

在控制台中可以看到，主类中的方法在进入虚拟机栈的时候，符合栈的特点

#### 问题辨析

- 垃圾回收是否涉及栈内存？
  - **不需要**。因为虚拟机栈中是由一个个栈帧组成的，在方法执行完毕后，对应的栈帧就会被弹出栈。所以无需通过垃圾回收机制去回收内存。
- 栈内存的分配越大越好吗？
  - 不是。因为**物理内存是一定的**，栈内存越大，可以支持更多的递归调用，但是可执行的线程数就会越少。
- 方法内的局部变量是否是线程安全的？
  - 如果方法内**局部变量没有逃离方法的作用范围**，则是**线程安全**的
  - 如果如果**局部变量引用了对象**，并**逃离了方法的作用范围**，则需要考虑线程安全问题

#### 内存溢出

**Java.lang.stackOverflowError** 栈内存溢出

**发生原因**

- 虚拟机栈中，**栈帧过多**（无限递归）
- 每个栈帧**所占用过大**

#### 线程运行诊断

CPU占用过高

- Linux环境下运行某些程序的时候，可能导致CPU的占用过高，这时需要定位占用CPU过高的线程
  - **top**命令，查看是哪个**进程**占用CPU过高
  - **ps H -eo pid, tid（线程id）, %cpu | grep 刚才通过top查到的进程号** 通过ps命令进一步查看是哪个线程占用CPU过高
  - **jstack 进程id** 通过查看进程中的线程的nid，刚才通过ps命令看到的tid来**对比定位**，注意jstack查找出的线程id是**16进制的**，**需要转换**

### 3、本地方法栈

一些带有**native关键字**的方法就是需要JAVA去调用本地的C或者C++方法，因为JAVA有时候没法直接和操作系统底层交互，所以需要用到本地方法

### 4、堆

#### 定义

通过new关键字**创建的对象**都会被放在堆内存

#### 特点

- **所有线程共享**，堆内存中的对象都需要**考虑线程安全问题**
- 有垃圾回收机制

#### 堆内存溢出

**java.lang.OutofMemoryError** ：java heap space. 堆内存溢出

#### 堆内存诊断

**jps**

**jmap**

**jconsole**

**jvirsalvm**

### 5、方法区

#### 结构

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150547.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150547.png)

#### 内存溢出

- 1.8以前会导致**永久代**内存溢出
- 1.8以后会导致**元空间**内存溢出

#### 常量池

二进制字节码的组成：类的基本信息、常量池、类的方法定义（包含了虚拟机指令）

**通过反编译来查看类的信息**

- 获得对应类的.class文件

  - 在JDK对应的bin目录下运行cmd，**也可以在IDEA控制台输入**

    [![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150602.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150602.png)

  - 输入 **javac 对应类的绝对路径**

    ```shell
    F:\JAVA\JDK8.0\bin>javac F:\Thread_study\src\com\nyima\JVM\day01\Main.java
    ```

    输入完成后，对应的目录下就会出现类的.class文件

- 在控制台输入 javap -v 类的绝对路径

  ```shell
  javap -v F:\Thread_study\src\com\nyima\JVM\day01\Main.class
  ```

- 然后能在控制台看到反编译以后类的信息了

  - 类的基本信息

    [![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150618.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150618.png)

  - 常量池

    [![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150630.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150630.png)

    [![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150641.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150641.png)

  - 虚拟机中执行编译的方法（框内的是真正编译执行的内容，**#号的内容需要在常量池中查找**）

    [![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150653.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150653.png)

#### 运行时常量池

- 常量池
  - 就是一张表（如上图中的constant pool），虚拟机指令根据这张常量表找到要执行的类名、方法名、参数类型、字面量信息
- 运行时常量池
  - 常量池是*.class文件中的，当该**类被加载以后**，它的常量池信息就会**放入运行时常量池**，并把里面的**符号地址变为真实地址**

#### 常量池与串池的关系

##### **串池**StringTable

**特征**

- 常量池中的字符串仅是符号，只有**在被用到时才会转化为对象**
- 利用串池的机制，来避免重复创建字符串对象
- 字符串**变量**拼接的原理是**StringBuilder**
- 字符串**常量**拼接的原理是**编译器优化**
- 可以使用**intern方法**，主动将串池中还没有的字符串对象放入串池中
- **注意**：无论是串池还是堆里面的字符串，都是对象

用来放字符串对象且里面的**元素不重复**

```java
public class StringTableStudy {
	public static void main(String[] args) {
		String a = "a"; 
		String b = "b";
		String ab = "ab";
	}
}
```

常量池中的信息，都会被加载到运行时常量池中，但这是a b ab 仅是常量池中的符号，**还没有成为java字符串**

```java
0: ldc           #2                  // String a
2: astore_1
3: ldc           #3                  // String b
5: astore_2
6: ldc           #4                  // String ab
8: astore_3
9: return
```

当执行到 ldc #2 时，会把符号 a 变为 “a” 字符串对象，**并放入串池中**（hashtable结构 不可扩容）

当执行到 ldc #3 时，会把符号 b 变为 “b” 字符串对象，并放入串池中

当执行到 ldc #4 时，会把符号 ab 变为 “ab” 字符串对象，并放入串池中

最终**StringTable [“a”, “b”, “ab”]**

**注意**：字符串对象的创建都是**懒惰的**，只有当运行到那一行字符串且在串池中不存在的时候（如 ldc #2）时，该字符串才会被创建并放入串池中。

使用拼接**字符串变量对象**创建字符串的过程

```java
public class StringTableStudy {
	public static void main(String[] args) {
		String a = "a";
		String b = "b";
		String ab = "ab";
		//拼接字符串对象来创建新的字符串
		String ab2 = a+b; 
	}
}
```

反编译后的结果

```java
	 Code:
      stack=2, locals=5, args_size=1
         0: ldc           #2                  // String a
         2: astore_1
         3: ldc           #3                  // String b
         5: astore_2
         6: ldc           #4                  // String ab
         8: astore_3
         9: new           #5                  // class java/lang/StringBuilder
        12: dup
        13: invokespecial #6                  // Method java/lang/StringBuilder."<init>":()V
        16: aload_1
        17: invokevirtual #7                  // Method java/lang/StringBuilder.append:(Ljava/lang/String
;)Ljava/lang/StringBuilder;
        20: aload_2
        21: invokevirtual #7                  // Method java/lang/StringBuilder.append:(Ljava/lang/String
;)Ljava/lang/StringBuilder;
        24: invokevirtual #8                  // Method java/lang/StringBuilder.toString:()Ljava/lang/Str
ing;
        27: astore        4
        29: return
```

通过拼接的方式来创建字符串的**过程**是：StringBuilder().append(“a”).append(“b”).toString()

最后的toString方法的返回值是一个**新的字符串**，但字符串的**值**和拼接的字符串一致，但是两个不同的字符串，**一个存在于串池之中，一个存在于堆内存之中**

```java
String ab = "ab";
String ab2 = a+b;
//结果为false,因为ab是存在于串池之中，ab2是由StringBuffer的toString方法所返回的一个对象，存在于堆内存之中
System.out.println(ab == ab2);
```

使用**拼接字符串常量对象**的方法创建字符串

```java
public class StringTableStudy {
	public static void main(String[] args) {
		String a = "a";
		String b = "b";
		String ab = "ab";
		String ab2 = a+b;
		//使用拼接字符串的方法创建字符串
		String ab3 = "a" + "b";
	}
}
```

反编译后的结果

```java
 	  Code:
      stack=2, locals=6, args_size=1
         0: ldc           #2                  // String a
         2: astore_1
         3: ldc           #3                  // String b
         5: astore_2
         6: ldc           #4                  // String ab
         8: astore_3
         9: new           #5                  // class java/lang/StringBuilder
        12: dup
        13: invokespecial #6                  // Method java/lang/StringBuilder."<init>":()V
        16: aload_1
        17: invokevirtual #7                  // Method java/lang/StringBuilder.append:(Ljava/lang/String
;)Ljava/lang/StringBuilder;
        20: aload_2
        21: invokevirtual #7                  // Method java/lang/StringBuilder.append:(Ljava/lang/String
;)Ljava/lang/StringBuilder;
        24: invokevirtual #8                  // Method java/lang/StringBuilder.toString:()Ljava/lang/Str
ing;
        27: astore        4
        //ab3初始化时直接从串池中获取字符串
        29: ldc           #4                  // String ab
        31: astore        5
        33: return
```

- 使用**拼接字符串常量**的方法来创建新的字符串时，因为**内容是常量，javac在编译期会进行优化，结果已在编译期确定为ab**，而创建ab的时候已经在串池中放入了“ab”，所以ab3直接从串池中获取值，所以进行的操作和 ab = “ab” 一致。
- 使用**拼接字符串变量**的方法来创建新的字符串时，因为内容是变量，只能**在运行期确定它的值，所以需要使用StringBuilder来创建**

##### intern方法 1.8

调用字符串对象的intern方法，会将该字符串对象尝试放入到串池中

- 如果串池中没有该字符串对象，则放入成功
- 如果有该字符串对象，则放入失败

无论放入是否成功，都会返回**串池中**的字符串对象

**注意**：此时如果调用intern方法成功，堆内存与串池中的字符串对象是同一个对象；如果失败，则不是同一个对象

**例1**

```java
public class Main {
	public static void main(String[] args) {
		//"a" "b" 被放入串池中，str则存在于堆内存之中
		String str = new String("a") + new String("b");
		//调用str的intern方法，这时串池中没有"ab"，则会将该字符串对象放入到串池中，此时堆内存与串池中的"ab"是同一个对象
		String st2 = str.intern();
		//给str3赋值，因为此时串池中已有"ab"，则直接将串池中的内容返回
		String str3 = "ab";
		//因为堆内存与串池中的"ab"是同一个对象，所以以下两条语句打印的都为true
		System.out.println(str == st2);
		System.out.println(str == str3);
	}
}
```

**例2**

```java
public class Main {
	public static void main(String[] args) {
        //此处创建字符串对象"ab"，因为串池中还没有"ab"，所以将其放入串池中
		String str3 = "ab";
        //"a" "b" 被放入串池中，str则存在于堆内存之中
		String str = new String("a") + new String("b");
        //此时因为在创建str3时，"ab"已存在与串池中，所以放入失败，但是会返回串池中的"ab"
		String str2 = str.intern();
        //false
		System.out.println(str == str2);
        //false
		System.out.println(str == str3);
        //true
		System.out.println(str2 == str3);
	}
}
```

##### intern方法 1.6

调用字符串对象的intern方法，会将该字符串对象尝试放入到串池中

- 如果串池中没有该字符串对象，会将该字符串对象复制一份，再放入到串池中
- 如果有该字符串对象，则放入失败

无论放入是否成功，都会返回**串池中**的字符串对象

**注意**：此时无论调用intern方法成功与否，串池中的字符串对象和堆内存中的字符串对象**都不是同一个对象**

#### StringTable 垃圾回收

StringTable在内存紧张时，会发生垃圾回收

#### StringTable调优

- 因为StringTable是由HashTable实现的，所以可以**适当增加HashTable桶的个数**，来减少字符串放入串池所需要的时间

  ```shell
  -XX:StringTableSize=xxxx
  ```

  

- 考虑是否需要将字符串对象入池

  可以通过**intern方法减少重复入池**



## 直接内存

- 属于操作系统，常见于NIO操作时，**用于数据缓冲区**
- 分配回收成本较高，但读写性能高
- 不受JVM内存回收管理

#### 文件读写流程

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150715.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150715.png)

**使用了DirectBuffer**

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150736.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150736.png)

直接内存是操作系统和Java代码**都可以访问的一块区域**，无需将代码从系统内存复制到Java堆内存，从而提高了效率

#### 释放原理

直接内存的回收不是通过JVM的垃圾回收来释放的，而是通过**unsafe.freeMemory**来手动释放

通过

```java
//通过ByteBuffer申请1M的直接内存
ByteBuffer byteBuffer = ByteBuffer.allocateDirect(_1M);
```

申请直接内存，但JVM并不能回收直接内存中的内容，它是如何实现回收的呢？

**allocateDirect的实现**

```java
public static ByteBuffer allocateDirect(int capacity) {
    return new DirectByteBuffer(capacity);
}
```

DirectByteBuffer类

```java
DirectByteBuffer(int cap) {   // package-private
   
    super(-1, 0, cap, cap);
    boolean pa = VM.isDirectMemoryPageAligned();
    int ps = Bits.pageSize();
    long size = Math.max(1L, (long)cap + (pa ? ps : 0));
    Bits.reserveMemory(size, cap);

    long base = 0;
    try {
        base = unsafe.allocateMemory(size); //申请内存
    } catch (OutOfMemoryError x) {
        Bits.unreserveMemory(size, cap);
        throw x;
    }
    unsafe.setMemory(base, size, (byte) 0);
    if (pa && (base % ps != 0)) {
        // Round up to page boundary
        address = base + ps - (base & (ps - 1));
    } else {
        address = base;
    }
    //通过虚引用，来实现直接内存的释放，this为虚引用的实际对象
    cleaner = Cleaner.create(this, new Deallocator(base, size, cap)); 
    att = null;
}
```

这里调用了一个Cleaner的create方法，且后台线程还会对虚引用的对象监测，如果虚引用的实际对象（这里是DirectByteBuffer）被回收以后，就会调用Cleaner的clean方法，来清除直接内存中占用的内存

```java
public void clean() {
       if (remove(this)) {
           try {
               this.thunk.run(); //调用run方法
           } catch (final Throwable var2) {
               AccessController.doPrivileged(new PrivilegedAction<Void>() {
                   public Void run() {
                       if (System.err != null) {
                           (new Error("Cleaner terminated abnormally", var2)).printStackTrace();
                       }

                       System.exit(1);
                       return null;
                   }
               });
           }
```

对应对象的run方法

```java
public void run() {
    if (address == 0) {
        // Paranoia
        return;
    }
    unsafe.freeMemory(address); //释放直接内存中占用的内存
    address = 0;
    Bits.unreserveMemory(size, capacity);
}
```

##### 直接内存的回收机制总结

- 使用了Unsafe类来完成直接内存的分配回收，回收需要主动调用freeMemory方法
- ByteBuffer的实现内部使用了Cleaner（虚引用）来检测ByteBuffer。一旦ByteBuffer被垃圾回收，那么会由ReferenceHandler来调用Cleaner的clean方法调用freeMemory来释放内存



## 垃圾回收

### 1、如何判断对象可以回收

#### 引用计数法

弊端：循环引用时，两个对象的计数都为1，导致两个对象都无法被释放

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150750.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150750.png)

#### 可达性分析算法

- JVM中的垃圾回收器通过**可达性分析**来探索所有存活的对象
- 扫描堆中的对象，看能否沿着GC Root对象为起点的引用链找到该对象，如果**找不到，则表示可以回收**
- 可以作为GC Root的对象
  - 虚拟机栈（栈帧中的本地变量表）中引用的对象。　
  - 方法区中类静态属性引用的对象
  - 方法区中常量引用的对象
  - 本地方法栈中JNI（即一般说的Native方法）引用的对象

#### 五种引用

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150800.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150800.png)

##### 强引用

只有GC Root**都不引用**该对象时，才会回收**强引用**对象

![image-20220104181028794](/img/9.png)

- 如上图B、C对象都不引用A1对象时，A1对象才会被回收

##### 软引用

当GC Root指向软引用对象时，在**内存不足时**，会**回收软引用所引用的对象**

![image-20220104181306315](/img/10.png)

- 如上图如果B对象不再引用A2对象且内存不足时，软引用所引用的A2对象就会被回收

###### 软引用的使用

```java
public class Demo1 {
	public static void main(String[] args) {
		final int _4M = 4*1024*1024;
		//使用软引用对象 list和SoftReference是强引用，而SoftReference和byte数组则是软引用
		List<SoftReference<byte[]>> list = new ArrayList<>();
		SoftReference<byte[]> ref= new SoftReference<>(new byte[_4M]);
	}
}
```

如果在垃圾回收时发现内存不足，在回收软引用所指向的对象时，**软引用本身不会被清理**

如果想要**清理软引用**，需要使**用引用队列**

```java
public class Demo1 {
	public static void main(String[] args) {
		final int _4M = 4*1024*1024;
		//使用引用队列，用于移除引用为空的软引用对象
		ReferenceQueue<byte[]> queue = new ReferenceQueue<>();
		//使用软引用对象 list和SoftReference是强引用，而SoftReference和byte数组则是软引用
		List<SoftReference<byte[]>> list = new ArrayList<>();
		SoftReference<byte[]> ref= new SoftReference<>(new byte[_4M]);

		//遍历引用队列，如果有元素，则移除
		Reference<? extends byte[]> poll = queue.poll();
		while(poll != null) {
			//引用队列不为空，则从集合中移除该元素
			list.remove(poll);
			//移动到引用队列中的下一个元素
			poll = queue.poll();
		}
	}
}
```

**大概思路为：**查看引用队列中有无软引用，如果有，则将该软引用从存放它的集合中移除（这里为一个list集合）

##### 弱引用

只有弱引用引用该对象时，在垃圾回收时，**无论内存是否充足**，都会回收弱引用所引用的对象

![image-20220104181807555](/img/11.png)

- 如上图如果B对象不再引用A3对象，则A3对象会被回收

**弱引用的使用和软引用类似**，只是将 **SoftReference 换为了 WeakReference**

##### **虚引用**

当虚引用（引用）所引用的对象（对象）被回收以后，虚引用对象就会被放入引用队列中，调用虚引用的方法

- 虚引用的一个体现是**释放直接内存所分配的内存**，当引用的对象ByteBuffer被垃圾回收以后，虚引用对象Cleaner就会被放入引用队列中，然后调用Cleaner的clean方法来释放直接内存
- 如上图，B对象不再引用ByteBuffer对象，ByteBuffer就会被回收。但是直接内存中的内存还未被回收。这时需要将虚引用对象Cleaner放入引用队列中，然后调用它的clean方法来释放直接内存

##### 终结器引用

所有的类都继承自Object类，Object类有一个finalize方法。当某个对象不再被其他的对象所引用时，会先将终结器引用对象放入引用队列中，然后根据终结器引用对象找到它所引用的对象，然后调用该对象的finalize方法。调用以后，该对象就可以被垃圾回收了

- 如上图，B对象不再引用A4对象。这时终结器对象就会被放入引用队列中，引用队列会根据它，找到它所引用的对象。然后调用被引用对象的finalize方法。调用以后，该对象就可以被垃圾回收了

##### 引用队列

- 软引用和弱引用**可以配合**引用队列
  - 在**软引用**和**弱引用**所引用的对象被回收以后，会将这些引用放入引用队列中，方便一起回收这些软/弱引用对象
- 虚引用和终结器引用**必须配合**引用队列
  - 虚引用和终结器引用在使用时会关联一个引用队列

### 2、垃圾回收算法

#### 标记-清除

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150813.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150813.png)

**定义**：标记清除算法顾名思义，是指在虚拟机执行垃圾回收的过程中，先采用标记算法确定可回收对象，然后垃圾收集器根据标识清除相应的内容，给堆内存腾出相应的空间

- 这里的腾出内存空间并不是将内存空间的字节清0，而是记录下这段内存的起始结束地址，下次分配内存的时候，会直接**覆盖**这段内存

**缺点**：**容易产生大量的内存碎片**，可能无法满足大对象的内存分配，一旦导致无法分配对象，那就会导致jvm启动gc，一旦启动gc，我们的应用程序就会暂停，这就导致应用的响应速度变慢

#### 标记-整理

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150827.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150827.png)

标记-整理 会将不被GC Root引用的对象回收，清除其占用的内存空间。然后整理剩余的对象，可以有效避免因内存碎片而导致的问题，但是因为整体需要消耗一定的时间，所以效率较低

#### 复制

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150842.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150842.png)

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150856.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150856.png)

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150907.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150907.png)

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150919.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150919.png)

将内存分为等大小的两个区域，FROM和TO（TO中为空）。先将被GC Root引用的对象从FROM放入TO中，再回收不被GC Root引用的对象。然后交换FROM和TO。这样也可以避免内存碎片的问题，但是会占用双倍的内存空间。

### 3、分代回收

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150931.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150931.png)

#### 回收流程

新创建的对象都被放在了**新生代的伊甸园**中

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150939.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150939.png)

当伊甸园中的内存不足时，就会进行一次垃圾回收，这时的回收叫做 **Minor GC**

Minor GC 会将**伊甸园和幸存区FROM**存活的对象**先**复制到 **幸存区 TO**中， 并让其**寿命加1**，再**交换两个幸存区**

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150946.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150946.png)

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150955.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150955.png)

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151002.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151002.png)

再次创建对象，若新生代的伊甸园又满了，则会**再次触发 Minor GC**（会触发 **stop the world**， 暂停其他用户线程，只让垃圾回收线程工作），这时不仅会回收伊甸园中的垃圾，**还会回收幸存区中的垃圾**，再将活跃对象复制到幸存区TO中。回收以后会交换两个幸存区，并让幸存区中的对象**寿命加1**

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151010.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151010.png)

如果幸存区中的对象的**寿命超过某个阈值**（最大为15，4bit），就会被**放入老年代**中

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151018.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151018.png)

如果新生代老年代中的内存都满了，就会先触发Minor GC，再触发**Full GC**，扫描**新生代和老年代中**所有不再使用的对象并回收。

![img](/img/12.png)

#### GC 分析

##### 大对象处理策略

当遇到一个**较大的对象**时，就算新生代的**伊甸园**为空，也**无法容纳该对象**时，会将该对象**直接晋升为老年代**

##### 线程内存溢出

某个线程的内存溢出了而抛异常（out of memory），不会让其他的线程结束运行

这是因为当一个线程**抛出OOM异常后**，**它所占据的内存资源会全部被释放掉**，从而不会影响其他线程的运行，**进程依然正常**

### 4、垃圾回收器

#### 相关概念

**并行收集**：指多条垃圾收集线程并行工作，但此时**用户线程仍处于等待状态**。

**并发收集**：指用户线程与垃圾收集线程**同时工作**（不一定是并行的可能会交替执行）。**用户程序在继续运行**，而垃圾收集程序运行在另一个CPU上

**吞吐量**：即CPU用于**运行用户代码的时间**与CPU**总消耗时间**的比值（吞吐量 = 运行用户代码时间 / ( 运行用户代码时间 + 垃圾收集时间 )），也就是。例如：虚拟机共运行100分钟，垃圾收集器花掉1分钟，那么吞吐量就是99%

#### 串行

- 单线程
- 内存较小，个人电脑（CPU核数较少）

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151027.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151027.png)

**安全点**：让其他线程都在这个点停下来，以免垃圾回收时移动对象地址，使得其他线程找不到被移动的对象

因为是串行的，所以只有一个垃圾回收线程。且在该线程执行回收工作时，其他线程进入**阻塞**状态

##### Serial 收集器

Serial收集器是最基本的、发展历史最悠久的收集器

**特点：**单线程、简单高效（与其他收集器的单线程相比），采用**复制算法**。对于限定单个CPU的环境来说，Serial收集器由于没有线程交互的开销，专心做垃圾收集自然可以获得最高的单线程收集效率。收集器进行垃圾回收时，必须暂停其他所有的工作线程，直到它结束（Stop The World）

##### ParNew 收集器

ParNew收集器其实就是Serial收集器的多线程版本

**特点**：多线程、ParNew收集器默认开启的收集线程数与CPU的数量相同，在CPU非常多的环境中，可以使用-XX:ParallelGCThreads参数来限制垃圾收集的线程数。和Serial收集器一样存在Stop The World问题

##### Serial Old 收集器

Serial Old是Serial收集器的老年代版本

**特点**：同样是单线程收集器，采用**标记-整理算法**

#### 吞吐量优先

- 多线程
- 堆内存较大，多核CPU
- 单位时间内，STW（stop the world，停掉其他所有工作线程）时间最短
- **JDK1.8默认使用**的垃圾回收器

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151039.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151039.png)

##### Parallel Scavenge 收集器

与吞吐量关系密切，故也称为吞吐量优先收集器

**特点**：属于新生代收集器也是采用**复制算法**的收集器（用到了新生代的幸存区），又是并行的多线程收集器（与ParNew收集器类似）

该收集器的目标是达到一个可控制的吞吐量。还有一个值得关注的点是：**GC自适应调节策略**（与ParNew收集器最重要的一个区别）

**GC自适应调节策略**：Parallel Scavenge收集器可设置-XX:+UseAdptiveSizePolicy参数。当开关打开时**不需要**手动指定新生代的大小（-Xmn）、Eden与Survivor区的比例（-XX:SurvivorRation）、晋升老年代的对象年龄（-XX:PretenureSizeThreshold）等，虚拟机会根据系统的运行状况收集性能监控信息，动态设置这些参数以提供最优的停顿时间和最高的吞吐量，这种调节方式称为GC的自适应调节策略。

Parallel Scavenge收集器使用两个参数控制吞吐量：

- XX:MaxGCPauseMillis 控制最大的垃圾收集停顿时间
- XX:GCRatio 直接设置吞吐量的大小

##### **Parallel Old 收集器**

是Parallel Scavenge收集器的老年代版本

**特点**：多线程，采用**标记-整理算法**（老年代没有幸存区）

#### 响应时间优先

- 多线程
- 堆内存较大，多核CPU
- 尽可能让单次STW时间变短（尽量不影响其他线程运行）

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151052.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151052.png)

##### CMS 收集器

Concurrent Mark Sweep，一种以获取**最短回收停顿时间**为目标的**老年代**收集器

**特点**：基于**标记-清除算法**实现。并发收集、低停顿，但是会产生内存碎片

**应用场景**：适用于注重服务的响应速度，希望系统停顿时间最短，给用户带来更好的体验等场景下。如web程序、b/s服务

**CMS收集器的运行过程分为下列4步：**

**初始标记**：标记GC Roots能直接到的对象。速度很快但是**仍存在Stop The World问题**

**并发标记**：进行GC Roots Tracing 的过程，找出存活对象且用户线程可并发执行

**重新标记**：为了**修正并发标记期间**因用户程序继续运行而导致标记产生变动的那一部分对象的标记记录。仍然存在Stop The World问题

**并发清除**：对标记的对象进行清除回收

CMS收集器的内存回收过程是与用户线程一起**并发执行**的

#### G1

##### **定义**：

Garbage One

JDK 9以后默认使用，而且替代了CMS 收集器

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200909201212.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200909201212.png)

##### 适用场景

- 同时注重吞吐量和低延迟（响应时间）
- 超大堆内存（内存大的），会将堆内存划分为多个**大小相等**的区域
- 整体上是**标记-整理**算法，两个区域之间是**复制**算法

**相关参数**：JDK8 并不是默认开启的，所需要参数开启

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151100.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151100.png)

##### G1垃圾回收阶段

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151109.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151109.png)

新生代伊甸园垃圾回收—–>内存不足，新生代回收+并发标记—–>回收新生代伊甸园、幸存区、老年代内存——>新生代伊甸园垃圾回收(重新开始)

##### Young Collection

**分区算法region**

分代是按对象的生命周期划分，分区则是将堆空间划分连续几个不同小区间，每一个小区间独立回收，可以控制一次回收多少个小区间，方便控制 GC 产生的停顿时间

E：伊甸园 S：幸存区 O：老年代

- 会STW

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151119.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151119.png)

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151129.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151129.png)

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151140.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151140.png)

##### Young Collection + CM

CM：并发标记

- 在 Young GC 时会**对 GC Root 进行初始标记**
- 在老年代**占用堆内存的比例**达到阈值时，会进行并发标记（不会STW），阈值可以根据用户来进行设定

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151150.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151150.png)

##### Mixed Collection

会对E S O 进行**全面的回收**

- 最终标记
- **拷贝**存活

-XX:MaxGCPauseMills:xxx 用于指定最长的停顿时间

**问**：为什么有的老年代被拷贝了，有的没拷贝？

因为指定了最大停顿时间，如果对所有老年代都进行回收，耗时可能过高。为了保证时间不超过设定的停顿时间，会**回收最有价值的老年代**（回收后，能够得到更多内存）

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151201.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151201.png)

##### Full GC

G1在老年代内存不足时（老年代所占内存超过阈值）

- 如果垃圾产生速度慢于垃圾回收速度，不会触发Full GC，还是并发地进行清理
- 如果垃圾产生速度快于垃圾回收速度，便会触发Full GC

##### Young Collection 跨代引用

- 新生代回收的跨代引用（老年代引用新生代）问题

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151211.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151211.png)

- 卡表与Remembered Set
  - Remembered Set 存在于E中，用于保存新生代对象对应的脏卡
    - 脏卡：O被划分为多个区域（一个区域512K），如果该区域引用了新生代对象，则该区域被称为脏卡
- 在引用变更时通过post-write barried + dirty card queue
- concurrent refinement threads 更新 Remembered Set

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151222.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151222.png)

##### Remark

重新标记阶段

在垃圾回收时，收集器处理对象的过程中

黑色：已被处理，需要保留的 灰色：正在处理中的 白色：还未处理的

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151229.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151229.png)

但是在**并发标记过程中**，有可能A被处理了以后未引用C，但该处理过程还未结束，在处理过程结束之前A引用了C，这时就会用到remark

过程如下

- 之前C未被引用，这时A引用了C，就会给C加一个写屏障，写屏障的指令会被执行，将C放入一个队列当中，并将C变为 处理中 状态
- 在**并发标记**阶段结束以后，重新标记阶段会STW，然后将放在该队列中的对象重新处理，发现有强引用引用它，就会处理它

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151239.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151239.png)

##### JDK 8u20 字符串去重

过程

- 将所有新分配的字符串（底层是char[]）放入一个队列
- 当新生代回收时，G1并发检查是否有重复的字符串
- 如果字符串的值一样，就让他们**引用同一个字符串对象**
- 注意，其与String.intern的区别
  - intern关注的是字符串对象
  - 字符串去重关注的是char[]
  - 在JVM内部，使用了不同的字符串标

优点与缺点

- 节省了大量内存
- 新生代回收时间略微增加，导致略微多占用CPU

##### JDK 8u40 并发标记类卸载

在并发标记阶段结束以后，就能知道哪些类不再被使用。如果一个类加载器的所有类都不在使用，则卸载它所加载的所有类

##### JDK 8u60 回收巨型对象

- 一个对象大于region的一半时，就称为巨型对象
- G1不会对巨型对象进行拷贝
- 回收时被优先考虑
- G1会跟踪老年代所有incoming引用，如果老年代incoming引用为0的巨型对象就可以在新生代垃圾回收时处理掉

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151249.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151249.png)

### 5、GC 调优

查看虚拟机参数命令

```shell
"F:\JAVA\JDK8.0\bin\java" -XX:+PrintFlagsFinal -version | findstr "GC"
```

可以根据参数去查询具体的信息

#### 调优领域

- 内存
- 锁竞争
- CPU占用
- IO
- GC

#### 确定目标

低延迟/高吞吐量？ 选择合适的GC

- CMS G1 ZGC
- ParallelGC
- Zing

#### 最快的GC是不发生GC

首先排除减少因为自身编写的代码而引发的内存问题

- 查看Full GC前后的内存占用，考虑以下几个问题
  - 数据是不是太多？
  - 数据表示是否太臃肿
    - 对象图
    - 对象大小
  - 是否存在内存泄漏

#### 新生代调优

- 新生代的特点
  - 所有的new操作分配内存都是非常廉价的
    - TLAB
  - 死亡对象回收零代价
  - 大部分对象用过即死（朝生夕死）
  - MInor GC 所用时间远小于Full GC
- 新生代内存越大越好么？
  - 不是
    - 新生代内存太小：频繁触发Minor GC，会STW，会使得吞吐量下降
    - 新生代内存太大：老年代内存占比有所降低，会更频繁地触发Full GC。而且触发Minor GC时，清理新生代所花费的时间会更长
  - 新生代内存设置为内容纳[并发量*(请求-响应)]的数据为宜

#### 幸存区调优

- 幸存区需要能够保存 **当前活跃对象**+**需要晋升的对象**
- 晋升阈值配置得当，让长时间存活的对象尽快晋升

#### 老年代调优



## 类加载与字节码技术

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151300.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151300.png)

### 1、类文件结构

首先获得.class字节码文件

方法：

- 在文本文档里写入java代码（文件名与类名一致），将文件类型改为.java
- java终端中，执行javac X:...\XXX.java

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200910155135.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200910155135.png)

以下是字节码文件

```shell
0000000 ca fe ba be 00 00 00 34 00 23 0a 00 06 00 15 09 
0000020 00 16 00 17 08 00 18 0a 00 19 00 1a 07 00 1b 07 
0000040 00 1c 01 00 06 3c 69 6e 69 74 3e 01 00 03 28 29 
0000060 56 01 00 04 43 6f 64 65 01 00 0f 4c 69 6e 65 4e 
0000100 75 6d 62 65 72 54 61 62 6c 65 01 00 12 4c 6f 63 
0000120 61 6c 56 61 72 69 61 62 6c 65 54 61 62 6c 65 01 
0000140 00 04 74 68 69 73 01 00 1d 4c 63 6e 2f 69 74 63 
0000160 61 73 74 2f 6a 76 6d 2f 74 35 2f 48 65 6c 6c 6f 
0000200 57 6f 72 6c 64 3b 01 00 04 6d 61 69 6e 01 00 16 
0000220 28 5b 4c 6a 61 76 61 2f 6c 61 6e 67 2f 53 74 72 
0000240 69 6e 67 3b 29 56 01 00 04 61 72 67 73 01 00 13 
0000260 5b 4c 6a 61 76 61 2f 6c 61 6e 67 2f 53 74 72 69 
0000300 6e 67 3b 01 00 10 4d 65 74 68 6f 64 50 61 72 61 
0000320 6d 65 74 65 72 73 01 00 0a 53 6f 75 72 63 65 46 
0000340 69 6c 65 01 00 0f 48 65 6c 6c 6f 57 6f 72 6c 64
0000360 2e 6a 61 76 61 0c 00 07 00 08 07 00 1d 0c 00 1e 
0000400 00 1f 01 00 0b 68 65 6c 6c 6f 20 77 6f 72 6c 64 
0000420 07 00 20 0c 00 21 00 22 01 00 1b 63 6e 2f 69 74 
0000440 63 61 73 74 2f 6a 76 6d 2f 74 35 2f 48 65 6c 6c 
0000460 6f 57 6f 72 6c 64 01 00 10 6a 61 76 61 2f 6c 61 
0000500 6e 67 2f 4f 62 6a 65 63 74 01 00 10 6a 61 76 61 
0000520 2f 6c 61 6e 67 2f 53 79 73 74 65 6d 01 00 03 6f 
0000540 75 74 01 00 15 4c 6a 61 76 61 2f 69 6f 2f 50 72 
0000560 69 6e 74 53 74 72 65 61 6d 3b 01 00 13 6a 61 76 
0000600 61 2f 69 6f 2f 50 72 69 6e 74 53 74 72 65 61 6d 
0000620 01 00 07 70 72 69 6e 74 6c 6e 01 00 15 28 4c 6a 
0000640 61 76 61 2f 6c 61 6e 67 2f 53 74 72 69 6e 67 3b 
0000660 29 56 00 21 00 05 00 06 00 00 00 00 00 02 00 01 
0000700 00 07 00 08 00 01 00 09 00 00 00 2f 00 01 00 01 
0000720 00 00 00 05 2a b7 00 01 b1 00 00 00 02 00 0a 00 
0000740 00 00 06 00 01 00 00 00 04 00 0b 00 00 00 0c 00 
0000760 01 00 00 00 05 00 0c 00 0d 00 00 00 09 00 0e 00 
0001000 0f 00 02 00 09 00 00 00 37 00 02 00 01 00 00 00 
0001020 09 b2 00 02 12 03 b6 00 04 b1 00 00 00 02 00 0a 
0001040 00 00 00 0a 00 02 00 00 00 06 00 08 00 07 00 0b 
0001060 00 00 00 0c 00 01 00 00 00 09 00 10 00 11 00 00 
0001100 00 12 00 00 00 05 01 00 10 00 00 00 01 00 13 00 
0001120 00 00 02 00 14
```

根据 JVM 规范，**类文件结构**如下

```shell
u4 			 magic
u2             minor_version;    
u2             major_version;    
u2             constant_pool_count;    
cp_info        constant_pool[constant_pool_count-1];    
u2             access_flags;    
u2             this_class;    
u2             super_class;   
u2             interfaces_count;    
u2             interfaces[interfaces_count];   
u2             fields_count;    
field_info     fields[fields_count];   
u2             methods_count;    
method_info    methods[methods_count];    
u2             attributes_count;    
attribute_info attributes[attributes_count];
```

#### 魔数

u4 magic

对应字节码文件的0~3个字节

0000000 **ca fe ba be** 00 00 00 34 00 23 0a 00 06 00 15 09

#### 版本

u2 minor_version;

u2 major_version;

0000000 ca fe ba be **00 00 00 34** 00 23 0a 00 06 00 15 09

34H = 52，代表JDK8

#### 常量池

见资料文件

…略

### 2、字节码指令

可参考

https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-6.html#jvms-6.5

#### javap工具

Oracle 提供了 **javap** 工具来反编译 class 文件

```
javap -v F:\Thread_study\src\com\nyima\JVM\day01\Main.class
F:\Thread_study>javap -v F:\Thread_study\src\com\nyima\JVM\day5\Demo1.class
Classfile /F:/Thread_study/src/com/nyima/JVM/day5/Demo1.class
  Last modified 2020-6-6; size 434 bytes
  MD5 checksum df1dce65bf6fb0b4c1de318051f4a67e
  Compiled from "Demo1.java"
public class com.nyima.JVM.day5.Demo1
  minor version: 0
  major version: 52
  flags: ACC_PUBLIC, ACC_SUPER
Constant pool:
   #1 = Methodref          #6.#15         // java/lang/Object."<init>":()V
   #2 = Fieldref           #16.#17        // java/lang/System.out:Ljava/io/PrintStream;
   #3 = String             #18            // hello world
   #4 = Methodref          #19.#20        // java/io/PrintStream.println:(Ljava/lang/String;)V
   #5 = Class              #21            // com/nyima/JVM/day5/Demo1
   #6 = Class              #22            // java/lang/Object
   #7 = Utf8               <init>
   #8 = Utf8               ()V
   #9 = Utf8               Code
  #10 = Utf8               LineNumberTable
  #11 = Utf8               main
  #12 = Utf8               ([Ljava/lang/String;)V
  #13 = Utf8               SourceFile
  #14 = Utf8               Demo1.java
  #15 = NameAndType        #7:#8          // "<init>":()V
  #16 = Class              #23            // java/lang/System
  #17 = NameAndType        #24:#25        // out:Ljava/io/PrintStream;
  #18 = Utf8               hello world
  #19 = Class              #26            // java/io/PrintStream
  #20 = NameAndType        #27:#28        // println:(Ljava/lang/String;)V
  #21 = Utf8               com/nyima/JVM/day5/Demo1
  #22 = Utf8               java/lang/Object
  #23 = Utf8               java/lang/System
  #24 = Utf8               out
  #25 = Utf8               Ljava/io/PrintStream;
  #26 = Utf8               java/io/PrintStream
  #27 = Utf8               println
  #28 = Utf8               (Ljava/lang/String;)V
{
  public com.nyima.JVM.day5.Demo1();
    descriptor: ()V
    flags: ACC_PUBLIC
    Code:
      stack=1, locals=1, args_size=1
         0: aload_0
         1: invokespecial #1                  // Method java/lang/Object."<init>":()V
         4: return
      LineNumberTable:
        line 7: 0

  public static void main(java.lang.String[]);
    descriptor: ([Ljava/lang/String;)V
    flags: ACC_PUBLIC, ACC_STATIC
    Code:
      stack=2, locals=1, args_size=1
         0: getstatic     #2                  // Field java/lang/System.out:Ljava/io/PrintStream;
         3: ldc           #3                  // String hello world
         5: invokevirtual #4                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V

         8: return
      LineNumberTable:
        line 9: 0
        line 10: 8
}
```

#### 图解方法执行流程

代码

```java
public class Demo3_1 {    
	public static void main(String[] args) {        
		int a = 10;        
		int b = Short.MAX_VALUE + 1;        
		int c = a + b;        
		System.out.println(c);   
    } 
}
```

**常量池载入运行时常量池**

常量池也属于方法区，只不过这里单独提出来了

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151317.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151317.png)

**方法字节码载入方法区**

（stack=2，locals=4） 对应操作数栈有2个空间（每个空间4个字节），局部变量表中有4个槽位

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151325.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151325.png)

**执行引擎开始执行字节码**

**bipush 10**

- 将一个 byte 压入操作数栈

  （其长度会补齐 4 个字节），类似的指令还有

  - sipush 将一个 short 压入操作数栈（其长度会补齐 4 个字节）
  - ldc 将一个 int 压入操作数栈
  - ldc2_w 将一个 long 压入操作数栈（**分两次压入**，因为 long 是 8 个字节）
  - 这里小的数字都是和字节码指令存在一起，**超过 short 范围的数字存入了常量池**

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151336.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151336.png)

**istore 1**

将操作数栈栈顶元素弹出，放入局部变量表的slot 1中

对应代码中的

```
a = 10
```

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151346.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151346.png)

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151412.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151412.png)

**ldc #3**

读取运行时常量池中#3，即32768(超过short最大值范围的数会被放到运行时常量池中)，将其加载到操作数栈中

注意 Short.MAX_VALUE 是 32767，所以 32768 = Short.MAX_VALUE + 1 实际是在编译期间计算好的

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151421.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151421.png)

**istore 2**

将操作数栈中的元素弹出，放到局部变量表的2号位置

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151432.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151432.png)

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151441.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151441.png)

**iload1 iload2**

将局部变量表中1号位置和2号位置的元素放入操作数栈中

- 因为只能在操作数栈中执行运算操作

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151450.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151450.png)

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151459.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151459.png)

**iadd**

将操作数栈中的两个元素**弹出栈**并相加，结果在压入操作数栈中

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151508.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151508.png)

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151523.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151523.png)

**istore 3**

将操作数栈中的元素弹出，放入局部变量表的3号位置

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151547.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151547.png)

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151555.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151555.png)

**getstatic #4**

在运行时常量池中找到#4，发现是一个对象

在堆内存中找到该对象，并将其**引用**放入操作数栈中

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151605.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151605.png)

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151613.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151613.png)

**iload 3**

将局部变量表中3号位置的元素压入操作数栈中

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151624.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151624.png)

**invokevirtual 5**

找到常量池 #5 项，定位到方法区 java/io/PrintStream.println:(I)V 方法

生成新的栈帧（分配 locals、stack等）

传递参数，执行新栈帧中的字节码

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151632.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151632.png)

执行完毕，弹出栈帧

清除 main 操作数栈内容

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151640.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608151640.png)

**return**
完成 main 方法调用，弹出 main 栈帧，程序结束

#### 通过字节码指令来分析问题

代码

```java
public class Demo2 {
	public static void main(String[] args) {
		int i=0;
		int x=0;
		while(i<10) {
			x = x++;
			i++;
		}
		System.out.println(x); //结果为0
	}
}
```

为什么最终的x结果为0呢？ 通过分析字节码指令即可知晓

```java
Code:
     stack=2, locals=3, args_size=1	//操作数栈分配2个空间，局部变量表分配3个空间
        0: iconst_0	//准备一个常数0
        1: istore_1	//将常数0放入局部变量表的1号槽位 i=0
        2: iconst_0	//准备一个常数0
        3: istore_2	//将常数0放入局部变量的2号槽位 x=0	
        4: iload_1		//将局部变量表1号槽位的数放入操作数栈中
        5: bipush        10	//将数字10放入操作数栈中，此时操作数栈中有2个数
        7: if_icmpge     21	//比较操作数栈中的两个数，如果下面的数大于上面的数，就跳转到21。这里的比较是将两个数做减法。因为涉及运算操作，所以会将两个数弹出操作数栈来进行运算。运算结束后操作数栈为空
       10: iload_2		//将局部变量2号槽位的数放入操作数栈中，放入的值是0
       11: iinc          2, 1	//将局部变量2号槽位的数加1，自增后，槽位中的值为1
       14: istore_2	//将操作数栈中的数放入到局部变量表的2号槽位，2号槽位的值又变为了0
       15: iinc          1, 1 //1号槽位的值自增1
       18: goto          4 //跳转到第4条指令
       21: getstatic     #2                  // Field java/lang/System.out:Ljava/io/PrintStream;
       24: iload_2
       25: invokevirtual #3                  // Method java/io/PrintStream.println:(I)V
       28: return
```

#### 构造方法

##### cinit()V

```java
public class Demo3 {
	static int i = 10;

	static {
		i = 20;
	}

	static {
		i = 30;
	}

	public static void main(String[] args) {
		System.out.println(i); //结果为30
	}
}
```

编译器会按**从上至下**的顺序，收集所有 static 静态代码块和静态成员赋值的代码，**合并**为一个特殊的方法 cinit()V ：

```
stack=1, locals=0, args_size=0
         0: bipush        10
         2: putstatic     #3                  // Field i:I
         5: bipush        20
         7: putstatic     #3                  // Field i:I
        10: bipush        30
        12: putstatic     #3                  // Field i:I
        15: return
```

##### init()V

```java
public class Demo4 {
	private String a = "s1";

	{
		b = 20;
	}

	private int b = 10;

	{
		a = "s2";
	}

	public Demo4(String a, int b) {
		this.a = a;
		this.b = b;
	}

	public static void main(String[] args) {
		Demo4 d = new Demo4("s3", 30);
		System.out.println(d.a);
		System.out.println(d.b);
	}
}
```

编译器会按**从上至下**的顺序，收集所有 {} 代码块和成员变量赋值的代码，**形成新的构造方法**，但**原始构造方法**内的代码**总是在后**

```
Code:
     stack=2, locals=3, args_size=3
        0: aload_0
        1: invokespecial #1                  // Method java/lang/Object."<init>":()V
        4: aload_0
        5: ldc           #2                  // String s1
        7: putfield      #3                  // Field a:Ljava/lang/String;
       10: aload_0
       11: bipush        20
       13: putfield      #4                  // Field b:I
       16: aload_0
       17: bipush        10
       19: putfield      #4                  // Field b:I
       22: aload_0
       23: ldc           #5                  // String s2
       25: putfield      #3                  // Field a:Ljava/lang/String;
       //原始构造方法在最后执行
       28: aload_0
       29: aload_1
       30: putfield      #3                  // Field a:Ljava/lang/String;
       33: aload_0
       34: iload_2
       35: putfield      #4                  // Field b:I
       38: return
```

#### 方法调用

```java
public class Demo5 {
	public Demo5() {

	}

	private void test1() {

	}

	private final void test2() {

	}

	public void test3() {

	}

	public static void test4() {

	}

	public static void main(String[] args) {
		Demo5 demo5 = new Demo5();
		demo5.test1();
		demo5.test2();
		demo5.test3();
		Demo5.test4();
	}
}
```

不同方法在调用时，对应的虚拟机指令有所区别

- 私有、构造、被final修饰的方法，在调用时都使用**invokespecial**指令
- 普通成员方法在调用时，使用invokespecial指令。因为编译期间无法确定该方法的内容，只有在运行期间才能确定
- 静态方法在调用时使用invokestatic指令

```
Code:
      stack=2, locals=2, args_size=1
         0: new           #2                  // class com/nyima/JVM/day5/Demo5 
         3: dup
         4: invokespecial #3                  // Method "<init>":()V
         7: astore_1
         8: aload_1
         9: invokespecial #4                  // Method test1:()V
        12: aload_1
        13: invokespecial #5                  // Method test2:()V
        16: aload_1
        17: invokevirtual #6                  // Method test3:()V
        20: invokestatic  #7                  // Method test4:()V
        23: return
```

- new 是创建【对象】，给对象分配堆内存，执行成功会将【**对象引用**】压入操作数栈
- dup 是赋值操作数栈栈顶的内容，本例即为【**对象引用**】，为什么需要两份引用呢，一个是要配合 invokespecial 调用该对象的构造方法 “init”:()V （会消耗掉栈顶一个引用），另一个要 配合 astore_1 赋值给局部变量
- 终方法（ﬁnal），私有方法（private），构造方法都是由 invokespecial 指令来调用，属于静态绑定
- 普通成员方法是由 invokevirtual 调用，属于**动态绑定**，即支持多态 成员方法与静态方法调用的另一个区别是，执行方法前是否需要【对象引用】

#### 多态原理

因为普通成员方法需要在运行时才能确定具体的内容，所以虚拟机需要调用**invokevirtual**指令

在执行invokevirtual指令时，经历了以下几个步骤

- 先通过栈帧中对象的引用找到对象
- 分析对象头，找到对象实际的Class
- Class结构中有**vtable**，它在类加载的链接阶段就已经根据方法的重写规则生成好了
- 查询vtable找到方法的具体地址
- 执行方法的字节码



#### 异常处理

##### try-catch

```java
public class Demo1 {
	public static void main(String[] args) {
		int i = 0;
		try {
			i = 10;
		}catch (Exception e) {
			i = 20;
		}
	}
}
```

对应字节码指令

```
Code:
     stack=1, locals=3, args_size=1
        0: iconst_0
        1: istore_1
        2: bipush        10
        4: istore_1
        5: goto          12
        8: astore_2
        9: bipush        20
       11: istore_1
       12: return
     //多出来一个异常表
     Exception table:
        from    to  target type
            2     5     8   Class java/lang/Exception
```

- 可以看到多出来一个 Exception table 的结构，[from, to) 是**前闭后开**（也就是检测2~4行）的检测范围，一旦这个范围内的字节码执行出现异常，则通过 type 匹配异常类型，如果一致，进入 target 所指示行号
- 8行的字节码指令 astore_2 是将异常对象引用存入局部变量表的2号位置（为e）

##### 多个single-catch

```java
public class Demo1 {
	public static void main(String[] args) {
		int i = 0;
		try {
			i = 10;
		}catch (ArithmeticException e) {
			i = 20;
		}catch (Exception e) {
			i = 30;
		}
	}
}
```

对应的字节码

```
Code:
     stack=1, locals=3, args_size=1
        0: iconst_0
        1: istore_1
        2: bipush        10
        4: istore_1
        5: goto          19
        8: astore_2
        9: bipush        20
       11: istore_1
       12: goto          19
       15: astore_2
       16: bipush        30
       18: istore_1
       19: return
     Exception table:
        from    to  target type
            2     5     8   Class java/lang/ArithmeticException
            2     5    15   Class java/lang/Exception
```

- 因为异常出现时，**只能进入** Exception table 中**一个分支**，所以局部变量表 slot 2 位置**被共用**

##### finally

```java
public class Demo2 {
	public static void main(String[] args) {
		int i = 0;
		try {
			i = 10;
		} catch (Exception e) {
			i = 20;
		} finally {
			i = 30;
		}
	}
}
```

对应字节码

```java
Code:
     stack=1, locals=4, args_size=1
        0: iconst_0
        1: istore_1
        //try块
        2: bipush        10
        4: istore_1
        //try块执行完后，会执行finally    
        5: bipush        30
        7: istore_1
        8: goto          27
       //catch块     
       11: astore_2 //异常信息放入局部变量表的2号槽位
       12: bipush        20
       14: istore_1
       //catch块执行完后，会执行finally        
       15: bipush        30
       17: istore_1
       18: goto          27
       //出现异常，但未被Exception捕获，会抛出其他异常，这时也需要执行finally块中的代码   
       21: astore_3
       22: bipush        30
       24: istore_1
       25: aload_3
       26: athrow  //抛出异常
       27: return
     Exception table:
        from    to  target type
            2     5    11   Class java/lang/Exception
            2     5    21   any
           11    15    21   any
```

可以看到 ﬁnally 中的代码被**复制了 3 份**，分别放入 try 流程，catch 流程以及 catch剩余的异常类型流程

**注意**：虽然从字节码指令看来，每个块中都有finally块，但是finally块中的代码**只会被执行一次**

##### finally中的return

```java
public class Demo3 {
	public static void main(String[] args) {
		int i = Demo3.test();
        //结果为20
		System.out.println(i);
	}

	public static int test() {
		int i;
		try {
			i = 10;
			return i;
		} finally {
			i = 20;
			return i;
		}
	}
}
```

对应字节码

```
Code:
     stack=1, locals=3, args_size=0
        0: bipush        10
        2: istore_0
        3: iload_0
        4: istore_1  //暂存返回值
        5: bipush        20
        7: istore_0
        8: iload_0
        9: ireturn	//ireturn会返回操作数栈顶的整型值20
       //如果出现异常，还是会执行finally块中的内容，没有抛出异常
       10: astore_2
       11: bipush        20
       13: istore_0
       14: iload_0
       15: ireturn	//这里没有athrow了，也就是如果在finally块中如果有返回操作的话，且try块中出现异常，会吞掉异常！
     Exception table:
        from    to  target type
            0     5    10   any
```

- 由于 ﬁnally 中的 **ireturn** 被插入了所有可能的流程，因此返回结果肯定以ﬁnally的为准
- 至于字节码中第 2 行，似乎没啥用，且留个伏笔，看下个例子
- 跟上例中的 ﬁnally 相比，发现**没有 athrow 了**，这告诉我们：如果在 ﬁnally 中出现了 return，会**吞掉异常**
- 所以**不要在finally中进行返回操作**

##### 被吞掉的异常

```java
public class Demo3 {
   public static void main(String[] args) {
      int i = Demo3.test();
      //最终结果为20
      System.out.println(i);
   }

   public static int test() {
      int i;
      try {
         i = 10;
         //这里应该会抛出异常
         i = i/0;
         return i;
      } finally {
         i = 20;
         return i;
      }
   }
}
```

会发现打印结果为20，并未抛出异常

##### finally不带return

```java
public class Demo4 {
	public static void main(String[] args) {
		int i = Demo4.test();
		System.out.println(i);
	}

	public static int test() {
		int i = 10;
		try {
			return i;
		} finally {
			i = 20;
		}
	}
}
```

对应字节码

```
Code:
     stack=1, locals=3, args_size=0
        0: bipush        10
        2: istore_0 //赋值给i 10
        3: iload_0	//加载到操作数栈顶
        4: istore_1 //加载到局部变量表的1号位置
        5: bipush        20
        7: istore_0 //赋值给i 20
        8: iload_1 //加载局部变量表1号位置的数10到操作数栈
        9: ireturn //返回操作数栈顶元素 10
       10: astore_2
       11: bipush        20
       13: istore_0
       14: aload_2 //加载异常
       15: athrow //抛出异常
     Exception table:
        from    to  target type
            3     5    10   any
```

#### Synchronized

```java
public class Demo5 {
	public static void main(String[] args) {
		int i = 10;
		Lock lock = new Lock();
		synchronized (lock) {
			System.out.println(i);
		}
	}
}

class Lock{}
```

对应字节码

```java
Code:
     stack=2, locals=5, args_size=1
        0: bipush        10
        2: istore_1
        3: new           #2                  // class com/nyima/JVM/day06/Lock
        6: dup //复制一份，放到操作数栈顶，用于构造函数消耗
        7: invokespecial #3                  // Method com/nyima/JVM/day06/Lock."<init>":()V
       10: astore_2 //剩下的一份放到局部变量表的2号位置
       11: aload_2 //加载到操作数栈
       12: dup //复制一份，放到操作数栈，用于加锁时消耗
       13: astore_3 //将操作数栈顶元素弹出，暂存到局部变量表的三号槽位。这时操作数栈中有一份对象的引用
       14: monitorenter //加锁
       //锁住后代码块中的操作    
       15: getstatic     #4                  // Field java/lang/System.out:Ljava/io/PrintStream;
       18: iload_1
       19: invokevirtual #5                  // Method java/io/PrintStream.println:(I)V
       //加载局部变量表中三号槽位对象的引用，用于解锁    
       22: aload_3    
       23: monitorexit //解锁
       24: goto          34
       //异常操作    
       27: astore        4
       29: aload_3
       30: monitorexit //解锁
       31: aload         4
       33: athrow
       34: return
     //可以看出，无论何时出现异常，都会跳转到27行，将异常放入局部变量中，并进行解锁操作，然后加载异常并抛出异常。      
     Exception table:
        from    to  target type
           15    24    27   any
           27    31    27   any
```

### 3、编译期处理

所谓的 **语法糖** ，其实就是指 java 编译器把 *.java 源码编译为 \*.class 字节码的过程中，**自动生成**和**转换**的一些代码，主要是为了减轻程序员的负担，算是 java 编译器给我们的一个额外福利

**注意**，以下代码的分析，借助了 javap 工具，idea 的反编译功能，idea 插件 jclasslib 等工具。另外， 编译器转换的**结果直接就是 class 字节码**，只是为了便于阅读，给出了 几乎等价 的 java 源码方式，并不是编译器还会转换出中间的 java 源码，切记。

#### 默认构造函数

```java
public class Candy1 {

}
```

经过编译期优化后

```java
public class Candy1 {
   //这个无参构造器是java编译器帮我们加上的
   public Candy1() {
      //即调用父类 Object 的无参构造方法，即调用 java/lang/Object." <init>":()V
      super();
   }
}
```

#### 自动拆装箱

基本类型和其包装类型的相互转换过程，称为拆装箱

在JDK 5以后，它们的转换可以在编译期自动完成

```java
public class Demo2 {
   public static void main(String[] args) {
      Integer x = 1;
      int y = x;
   }
}
```

转换过程如下

```java
public class Demo2 {
   public static void main(String[] args) {
      //基本类型赋值给包装类型，称为装箱
      Integer x = Integer.valueOf(1);
      //包装类型赋值给基本类型，称谓拆箱
      int y = x.intValue();
   }
}
```

#### 泛型集合取值

泛型也是在 JDK 5 开始加入的特性，但 java 在**编译泛型代码后**会执行 **泛型擦除** 的动作，即泛型信息在编译为字节码之后就**丢失**了，实际的类型都当做了 **Object** 类型来处理：

```java
public class Demo3 {
   public static void main(String[] args) {
      List<Integer> list = new ArrayList<>();
      list.add(10);
      Integer x = list.get(0);
   }
}
```

对应字节码

```
Code:
    stack=2, locals=3, args_size=1
       0: new           #2                  // class java/util/ArrayList
       3: dup
       4: invokespecial #3                  // Method java/util/ArrayList."<init>":()V
       7: astore_1
       8: aload_1
       9: bipush        10
      11: invokestatic  #4                  // Method java/lang/Integer.valueOf:(I)Ljava/lang/Integer;
      //这里进行了泛型擦除，实际调用的是add(Objcet o)
      14: invokeinterface #5,  2            // InterfaceMethod java/util/List.add:(Ljava/lang/Object;)Z

      19: pop
      20: aload_1
      21: iconst_0
      //这里也进行了泛型擦除，实际调用的是get(Object o)   
      22: invokeinterface #6,  2            // InterfaceMethod java/util/List.get:(I)Ljava/lang/Object;
//这里进行了类型转换，将Object转换成了Integer
      27: checkcast     #7                  // class java/lang/Integer
      30: astore_2
      31: return
```

所以调用get函数取值时，有一个类型转换的操作

```
Integer x = (Integer) list.get(0);
```

如果要将返回结果赋值给一个int类型的变量，则还有**自动拆箱**的操作

```
int x = (Integer) list.get(0).intValue();
```

#### 可变参数

```java
public class Demo4 {
   public static void foo(String... args) {
      //将args赋值给arr，可以看出String...实际就是String[] 
      String[] arr = args;
      System.out.println(arr.length);
   }

   public static void main(String[] args) {
      foo("hello", "world");
   }
}
```

可变参数 **String…** args 其实是一个 **String[]** args ，从代码中的赋值语句中就可以看出来。 同 样 java 编译器会在编译期间将上述代码变换为：

```java
public class Demo4 {
   public Demo4 {}

    
   public static void foo(String[] args) {
      String[] arr = args;
      System.out.println(arr.length);
   }

   public static void main(String[] args) {
      foo(new String[]{"hello", "world"});
   }
}
```

注意，如果调用的是foo()，即未传递参数时，等价代码为foo(new String[]{})，**创建了一个空数组**，而不是直接传递的null

#### foreach

```java
public class Demo5 {
	public static void main(String[] args) {
        //数组赋初值的简化写法也是一种语法糖。
		int[] arr = {1, 2, 3, 4, 5};
		for(int x : arr) {
			System.out.println(x);
		}
	}
}
```

编译器会帮我们转换为

```java
public class Demo5 {
    public Demo5 {}

	public static void main(String[] args) {
		int[] arr = new int[]{1, 2, 3, 4, 5};
		for(int i=0; i<arr.length; ++i) {
			int x = arr[i];
			System.out.println(x);
		}
	}
}
```

**如果是集合使用foreach**

```java
public class Demo5 {
   public static void main(String[] args) {
      List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);
      for (Integer x : list) {
         System.out.println(x);
      }
   }
}
```

集合要使用foreach，需要该集合类实现了**Iterable接口**，因为集合的遍历需要用到**迭代器Iterator**

```java
public class Demo5 {
    public Demo5 {}
    
   public static void main(String[] args) {
      List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);
      //获得该集合的迭代器
      Iterator<Integer> iterator = list.iterator();
      while(iterator.hasNext()) {
         Integer x = iterator.next();
         System.out.println(x);
      }
   }
}
```

#### switch字符串

```java
public class Demo6 {
   public static void main(String[] args) {
      String str = "hello";
      switch (str) {
         case "hello" :
            System.out.println("h");
            break;
         case "world" :
            System.out.println("w");
            break;
         default:
            break;
      }
   }
}
```

在编译器中执行的操作

```java
public class Demo6 {
   public Demo6() {
      
   }
   public static void main(String[] args) {
      String str = "hello";
      int x = -1;
      //通过字符串的hashCode+value来判断是否匹配
      switch (str.hashCode()) {
         //hello的hashCode
         case 99162322 :
            //再次比较，因为字符串的hashCode有可能相等
            if(str.equals("hello")) {
               x = 0;
            }
            break;
         //world的hashCode
         case 11331880 :
            if(str.equals("world")) {
               x = 1;
            }
            break;
         default:
            break;
      }

      //用第二个switch在进行输出判断
      switch (x) {
         case 0:
            System.out.println("h");
            break;
         case 1:
            System.out.println("w");
            break;
         default:
            break;
      }
   }
}
```

过程说明：

- 在编译期间，单个的switch被分为了两个
  - 第一个用来匹配字符串，并给x赋值
    - 字符串的匹配用到了字符串的hashCode，还用到了equals方法
    - 使用hashCode是为了提高比较效率，使用equals是防止有hashCode冲突（如BM和C.）
  - 第二个用来根据x的值来决定输出语句

#### switch枚举

```java
public class Demo7 {
   public static void main(String[] args) {
      SEX sex = SEX.MALE;
      switch (sex) {
         case MALE:
            System.out.println("man");
            break;
         case FEMALE:
            System.out.println("woman");
            break;
         default:
            break;
      }
   }
}

enum SEX {
   MALE, FEMALE;
}
```

编译器中执行的代码如下

```java
public class Demo7 {
   /**     
    * 定义一个合成类（仅 jvm 使用，对我们不可见）     
    * 用来映射枚举的 ordinal 与数组元素的关系     
    * 枚举的 ordinal 表示枚举对象的序号，从 0 开始     
    * 即 MALE 的 ordinal()=0，FEMALE 的 ordinal()=1     
    */ 
   static class $MAP {
      //数组大小即为枚举元素个数，里面存放了case用于比较的数字
      static int[] map = new int[2];
      static {
         //ordinal即枚举元素对应所在的位置，MALE为0，FEMALE为1
         map[SEX.MALE.ordinal()] = 1;
         map[SEX.FEMALE.ordinal()] = 2;
      }
   }

   public static void main(String[] args) {
      SEX sex = SEX.MALE;
      //将对应位置枚举元素的值赋给x，用于case操作
      int x = $MAP.map[sex.ordinal()];
      switch (x) {
         case 1:
            System.out.println("man");
            break;
         case 2:
            System.out.println("woman");
            break;
         default:
            break;
      }
   }
}

enum SEX {
   MALE, FEMALE;
}
```

#### 枚举类

```java
enum SEX {
   MALE, FEMALE;
}
```

转换后的代码

```java
public final class Sex extends Enum<Sex> {   
   //对应枚举类中的元素
   public static final Sex MALE;    
   public static final Sex FEMALE;    
   private static final Sex[] $VALUES;
   
    static {       
    	//调用构造函数，传入枚举元素的值及ordinal
    	MALE = new Sex("MALE", 0);    
        FEMALE = new Sex("FEMALE", 1);   
        $VALUES = new Sex[]{MALE, FEMALE}; 
   }
 	
   //调用父类中的方法
    private Sex(String name, int ordinal) {     
        super(name, ordinal);    
    }
   
    public static Sex[] values() {  
        return $VALUES.clone();  
    }
    public static Sex valueOf(String name) { 
        return Enum.valueOf(Sex.class, name);  
    } 
   
}
```

#### 匿名内部类

```java
public class Demo8 {
   public static void main(String[] args) {
      Runnable runnable = new Runnable() {
         @Override
         public void run() {
            System.out.println("running...");
         }
      };
   }
}
```

转换后的代码

```java
public class Demo8 {
   public static void main(String[] args) {
      //用额外创建的类来创建匿名内部类对象
      Runnable runnable = new Demo8$1();
   }
}

//创建了一个额外的类，实现了Runnable接口
final class Demo8$1 implements Runnable {
   public Demo8$1() {}

   @Override
   public void run() {
      System.out.println("running...");
   }
}
```

如果匿名内部类中引用了**局部变量**

```java
public class Demo8 {
   public static void main(String[] args) {
      int x = 1;
      Runnable runnable = new Runnable() {
         @Override
         public void run() {
            System.out.println(x);
         }
      };
   }
}
```

转化后代码

```java
// 代码有问题
public class Demo8 {
   public static void main(String[] args) {
      int x = 1;
      Runnable runnable = new Demo8$1() {
         @Override
         public void run() {
            System.out.println(x);
         }
      };
   }
}

final class Demo8$1 implements Runnable {
   //多创建了一个变量
   int val$x;
   //变为了有参构造器
   public Demo8$1(int x) {
      this.val$x = x;
   }

   @Override
   public void run() {
      System.out.println(val$x);
   }
}
```

### 4、类加载阶段

#### 加载

- 将类的字节码载入

  方法区

  （1.8后为元空间，在本地内存中）中，内部采用 C++ 的 instanceKlass 描述 java 类，它的重要 ﬁeld 有：

  - _java_mirror 即 java 的类镜像，例如对 String 来说，它的镜像类就是 String.class，作用是把 klass 暴露给 java 使用
  - _super 即父类
  - _ﬁelds 即成员变量
  - _methods 即方法
  - _constants 即常量池
  - _class_loader 即类加载器
  - _vtable 虚方法表
  - _itable 接口方法

- 如果这个类还有父类没有加载，**先加载父类**

- 加载和链接可能是**交替运行**的

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200611205050.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200611205050.png)

- instanceKlass保存在**方法区**。JDK 8以后，方法区位于元空间中，而元空间又位于本地内存中
- _java_mirror则是保存在**堆内存**中
- InstanceKlass和*.class(JAVA镜像类)互相保存了对方的地址
- 类的对象在对象头中保存了*.class的地址。让对象可以通过其找到方法区中的instanceKlass，从而获取类的各种信息

#### 链接

##### 验证

验证类是否符合 JVM规范，安全性检查

##### 准备

为 static 变量分配空间，设置默认值

- static变量在JDK 7以前是存储与instanceKlass末尾。但在JDK 7以后就存储在_java_mirror末尾了
- static变量在分配空间和赋值是在两个阶段完成的。分配空间在准备阶段完成，赋值在初始化阶段完成
- 如果 static 变量是 ﬁnal 的**基本类型**，或者是**字符串常量**，那么编译阶段值就确定了，**赋值在准备阶段完成**
- 如果 static 变量是 ﬁnal 的，但属于**引用类型**，那么赋值也会在**初始化阶段完成**

##### 解析

**HSDB的使用**

- 先获得要查看的进程ID

```shell
jps
```

- 打开HSDB

```shell
java -cp F:\JAVA\JDK8.0\lib\sa-jdi.jar sun.jvm.hotspot.HSDB
```

- 运行时可能会报错，是因为**缺少一个.dll的文件**，我们在JDK的安装目录中找到该文件，复制到缺失的文件下即可

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200611221703.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200611221703.png)

- 定位需要的进程

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200611221857.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200611221857.png)

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200611222029.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200611222029.png)

**解析的含义**

将常量池中的符号引用解析为直接引用

- 未解析时，常量池中的看到的对象仅是符号，未真正的存在于内存中

```java
public class Demo1 {
   public static void main(String[] args) throws IOException, ClassNotFoundException {
      ClassLoader loader = Demo1.class.getClassLoader();
      //只加载不解析
      Class<?> c = loader.loadClass("com.nyima.JVM.day8.C");
      //用于阻塞主线程
      System.in.read();
   }
}

class C {
   D d = new D();
}

class D {

}
```

- 打开HSDB
  - 可以看到此时只加载了类C

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200611223153.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200611223153.png)

查看类C的常量池，可以看到类D**未被解析**，只是存在于常量池中的符号

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200611230658.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200611230658.png)

- 解析以后，会将常量池中的符号引用解析为直接引用

  - 可以看到，此时已加载并解析了类C和类D

  [![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200611223441.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200611223441.png)

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200613104723.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200613104723.png)

#### 初始化

初始化阶段就是**执行类构造器clinit()方法的过程**，虚拟机会保证这个类的『构造方法』的线程安全

- clinit()方法是由编译器自动收集类中的所有类变量的**静态赋值动作和静态代码块**（static{}块）中的语句合并产生的

**注意**

编译器收集的顺序是由语句在源文件中**出现的顺序决定**的，静态语句块中只能访问到定义在静态语句块之前的变量，定义在它**之后**的变量，在前面的静态语句块**可以赋值，但是不能访问**，如

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20201118204542.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20201118204542.png)

##### 发生时机

**类的初始化的懒惰的**，以下情况会初始化

- main 方法所在的类，总会被首先初始化
- 首次访问这个类的静态变量或静态方法时
- 子类初始化，如果父类还没初始化，会引发
- 子类访问父类的静态变量，只会触发父类的初始化
- Class.forName
- new 会导致初始化

以下情况不会初始化

- 访问类的 static ﬁnal 静态常量（基本类型和字符串）因为这两个是在准备阶段就赋值了
- 类对象.class 不会触发初始化
- 创建该类对象的数组
- 类加载器的.loadClass方法
- Class.forNamed的参数2为false时

**验证类是否被初始化，可以看改类的静态代码块是否被执行**

### 5、类加载器

Java虚拟机设计团队有意把类加载阶段中的**“通过一个类的全限定名来获取描述该类的二进制字节流”**这个动作放到Java虚拟机外部去实现，以便让应用程序自己决定如何去获取所需的类。实现这个动作的代码被称为**“类加载器”**（ClassLoader）

#### 类与类加载器

类加载器虽然只用于实现类的加载动作，但它在Java程序中起到的作用却远超类加载阶段

对于任意一个类，都必须由加载它的**类加载器**和这个**类本身**一起共同确立其在Java虚拟机中的唯一性，每一个类加载器，都拥有一个独立的类名称空间。这句话可以表达得更通俗一些：**比较两个类是否“相等”，只有在这两个类是由同一个类加载器加载的前提下才有意义**，否则，即使这两个类来源于同一个Class文件，被同一个Java虚拟机加载，只要加载它们的类加载器不同，那这两个类就必定不相等

以JDK 8为例

| 名称                                      | 加载的类              | 说明                            |
| ----------------------------------------- | --------------------- | ------------------------------- |
| Bootstrap ClassLoader（启动类加载器）     | JAVA_HOME/jre/lib     | 无法直接访问                    |
| Extension ClassLoader(拓展类加载器)       | JAVA_HOME/jre/lib/ext | 上级为Bootstrap，**显示为null** |
| Application ClassLoader(应用程序类加载器) | classpath             | 上级为Extension                 |
| 自定义类加载器                            | 自定义                | 上级为Application               |

#### 启动类加载器

可通过在控制台输入指令，使得类被启动类加器加载

#### 拓展类加载器

如果classpath和JAVA_HOME/jre/lib/ext 下有同名类，加载时会使用**拓展类加载器**加载。当应用程序类加载器发现拓展类加载器已将该同名类加载过了，则不会再次加载

#### 双亲委派模式

双亲委派模式，即调用类加载器ClassLoader 的 loadClass 方法时，查找类的规则

loadClass源码

```java
protected Class<?> loadClass(String name, boolean resolve)
    throws ClassNotFoundException
{
    synchronized (getClassLoadingLock(name)) {
        // 首先查找该类是否已经被该类加载器加载过了
        Class<?> c = findLoadedClass(name);
        //如果没有被加载过
        if (c == null) {
            long t0 = System.nanoTime();
            try {
                //看是否被它的上级加载器加载过了 Extension的上级是Bootstarp，但它显示为null
                if (parent != null) {
                    c = parent.loadClass(name, false);
                } else {
                    //看是否被启动类加载器加载过
                    c = findBootstrapClassOrNull(name);
                }
            } catch (ClassNotFoundException e) {
                // ClassNotFoundException thrown if class not found
                // from the non-null parent class loader
                //捕获异常，但不做任何处理
            }

            if (c == null) {
                //如果还是没有找到，先让拓展类加载器调用findClass方法去找到该类，如果还是没找到，就抛出异常
                //然后让应用类加载器去找classpath下找该类
                long t1 = System.nanoTime();
                c = findClass(name);

                // 记录时间
                sun.misc.PerfCounter.getParentDelegationTime().addTime(t1 - t0);
                sun.misc.PerfCounter.getFindClassTime().addElapsedTimeFrom(t1);
                sun.misc.PerfCounter.getFindClasses().increment();
            }
        }
        if (resolve) {
            resolveClass(c);
        }
        return c;
    }
}
```

#### 自定义类加载器

##### 使用场景

- 想加载非 classpath 随意路径中的类文件
- 通过接口来使用实现，希望解耦时，常用在框架设计
- 这些类希望予以隔离，不同应用的同名类都可以加载，不冲突，常见于 tomcat 容器

##### 步骤

- 继承ClassLoader父类
- 要遵从双亲委派机制，重写 ﬁndClass 方法
  - 不是重写loadClass方法，否则不会走双亲委派机制
- 读取类文件的字节码
- 调用父类的 deﬁneClass 方法来加载类
- 使用者调用该类加载器的 loadClass 方法

#### 破坏双亲委派模式

- 双亲委派模型的第一次“被破坏”其实发生在双亲委派模型出现之前——即JDK1.2面世以前的“远古”时代
  - 建议用户重写findClass()方法，在类加载器中的loadClass()方法中也会调用该方法
- 双亲委派模型的第二次“被破坏”是由这个模型自身的缺陷导致的
  - 如果有基础类型又要调用回用户的代码，此时也会破坏双亲委派模式
- 双亲委派模型的第三次“被破坏”是由于用户对程序动态性的追求而导致的
  - 这里所说的“动态性”指的是一些非常“热”门的名词：代码热替换（Hot Swap）、模块热部署（Hot Deployment）等

### 6、运行期优化

#### 分层编译

JVM 将执行状态分成了 5 个层次：

- 0层：解释执行，用解释器将字节码翻译为机器码
- 1层：使用 C1 **即时编译器**编译执行（不带 proﬁling）
- 2层：使用 C1 即时编译器编译执行（带基本的profiling）
- 3层：使用 C1 即时编译器编译执行（带完全的profiling）
- 4层：使用 C2 即时编译器编译执行

proﬁling 是指在运行过程中收集一些程序执行状态的数据，例如【方法的调用次数】，【循环的 回边次数】等

##### 即时编译器（JIT）与解释器的区别

- 解释器
  - 将字节码**解释**为机器码，下次即使遇到相同的字节码，仍会执行重复的解释
  - 是将字节码解释为针对所有平台都通用的机器码
- 即时编译器
  - 将一些字节码**编译**为机器码，**并存入 Code Cache**，下次遇到相同的代码，直接执行，无需再编译
  - 根据平台类型，生成平台特定的机器码

对于大部分的不常用的代码，我们无需耗费时间将其编译成机器码，而是采取解释执行的方式运行；另一方面，对于仅占据小部分的热点代码，我们则可以将其编译成机器码，以达到理想的运行速度。 执行效率上简单比较一下 Interpreter < C1 < C2，总的目标是发现热点代码（hotspot名称的由 来），并优化这些热点代码

#### 逃逸分析

逃逸分析（Escape Analysis）简单来讲就是，Java Hotspot 虚拟机可以分析新创建对象的使用范围，并决定是否在 Java 堆上分配内存的一项技术

逃逸分析的 JVM 参数如下：

- 开启逃逸分析：-XX:+DoEscapeAnalysis
- 关闭逃逸分析：-XX:-DoEscapeAnalysis
- 显示分析结果：-XX:+PrintEscapeAnalysis

逃逸分析技术在 Java SE 6u23+ 开始支持，并默认设置为启用状态，可以不用额外加这个参数

**对象逃逸状态**

**全局逃逸（GlobalEscape）**

- 即一个对象的作用范围逃出了当前方法或者当前线程，有以下几种场景：
  - 对象是一个静态变量
  - 对象是一个已经发生逃逸的对象
  - 对象作为当前方法的返回值

**参数逃逸（ArgEscape）**

- 即一个对象被作为方法参数传递或者被参数引用，但在调用过程中不会发生全局逃逸，这个状态是通过被调方法的字节码确定的

**没有逃逸**

- 即方法中的对象没有发生逃逸

**逃逸分析优化**

针对上面第三点，当一个对象**没有逃逸**时，可以得到以下几个虚拟机的优化

##### **锁消除**

我们知道线程同步锁是非常牺牲性能的，当编译器确定当前对象只有当前线程使用，那么就会移除该对象的同步锁

例如，StringBuffer 和 Vector 都是用 synchronized 修饰线程安全的，但大部分情况下，它们都只是在当前线程中用到，这样编译器就会优化移除掉这些锁操作

锁消除的 JVM 参数如下：

- 开启锁消除：-XX:+EliminateLocks
- 关闭锁消除：-XX:-EliminateLocks

锁消除在 JDK8 中都是默认开启的，并且锁消除都要建立在逃逸分析的基础上

##### **标量替换**

首先要明白标量和聚合量，**基础类型**和**对象的引用**可以理解为**标量**，它们不能被进一步分解。而能被进一步分解的量就是聚合量，比如：对象

对象是聚合量，它又可以被进一步分解成标量，将其成员变量分解为分散的变量，这就叫做**标量替换**。

这样，如果一个对象没有发生逃逸，那压根就不用创建它，只会在栈或者寄存器上创建它用到的成员标量，节省了内存空间，也提升了应用程序性能

标量替换的 JVM 参数如下：

- 开启标量替换：-XX:+EliminateAllocations
- 关闭标量替换：-XX:-EliminateAllocations
- 显示标量替换详情：-XX:+PrintEliminateAllocations

标量替换同样在 JDK8 中都是默认开启的，并且都要建立在逃逸分析的基础上

##### **栈上分配**

当对象没有发生逃逸时，该**对象**就可以通过标量替换分解成成员标量分配在**栈内存**中，和方法的生命周期一致，随着栈帧出栈时销毁，减少了 GC 压力，提高了应用程序性能

#### 方法内联

##### **内联函数**

内联函数就是在程序编译时，编译器将程序中出现的内联函数的调用表达式用内联函数的函数体来直接进行替换

##### **JVM内联函数**

C++是否为内联函数由自己决定，Java由**编译器决定**。Java不支持直接声明为内联函数的，如果想让他内联，你只能够向编译器提出请求: 关键字**final修饰** 用来指明那个函数是希望被JVM内联的，如

```java
public final void doSomething() {  
        // to do something  
}
```

总的来说，一般的函数都不会被当做内联函数，只有声明了final后，编译器才会考虑是不是要把你的函数变成内联函数

JVM内建有许多运行时优化。首先**短方法**更利于JVM推断。流程更明显，作用域更短，副作用也更明显。如果是长方法JVM可能直接就跪了。

第二个原因则更重要：**方法内联**

如果JVM监测到一些**小方法被频繁的执行**，它会把方法的调用替换成方法体本身，如：

```java
private int add4(int x1, int x2, int x3, int x4) { 
		//这里调用了add2方法
        return add2(x1, x2) + add2(x3, x4);  
    }  

    private int add2(int x1, int x2) {  
        return x1 + x2;  
    }
```

方法调用被替换后

```java
private int add4(int x1, int x2, int x3, int x4) {  
    	//被替换为了方法本身
        return x1 + x2 + x3 + x4;  
    }
```

#### 反射优化

```java
public class Reflect1 {
   public static void foo() {
      System.out.println("foo...");
   }

   public static void main(String[] args) throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
      Method foo = Demo3.class.getMethod("foo");
      for(int i = 0; i<=16; i++) {
         foo.invoke(null);
      }
   }
}
```

foo.invoke 前面 0 ~ 15 次调用使用的是 MethodAccessor 的 NativeMethodAccessorImpl 实现

invoke方法源码

```java
@CallerSensitive
public Object invoke(Object obj, Object... args)
    throws IllegalAccessException, IllegalArgumentException,
       InvocationTargetException
{
    if (!override) {
        if (!Reflection.quickCheckMemberAccess(clazz, modifiers)) {
            Class<?> caller = Reflection.getCallerClass();
            checkAccess(caller, clazz, obj, modifiers);
        }
    }
    //MethodAccessor是一个接口，有3个实现类，其中有一个是抽象类
    MethodAccessor ma = methodAccessor;             // read volatile
    if (ma == null) {
        ma = acquireMethodAccessor();
    }
    return ma.invoke(obj, args);
}
```

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200614133554.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200614133554.png)

会由DelegatingMehodAccessorImpl去调用NativeMethodAccessorImpl

NativeMethodAccessorImpl源码

```java
class NativeMethodAccessorImpl extends MethodAccessorImpl {
    private final Method method;
    private DelegatingMethodAccessorImpl parent;
    private int numInvocations;

    NativeMethodAccessorImpl(Method var1) {
        this.method = var1;
    }
	
	//每次进行反射调用，会让numInvocation与ReflectionFactory.inflationThreshold的值（15）进行比较，并使使得numInvocation的值加一
	//如果numInvocation>ReflectionFactory.inflationThreshold，则会调用本地方法invoke0方法
    public Object invoke(Object var1, Object[] var2) throws IllegalArgumentException, InvocationTargetException {
        if (++this.numInvocations > ReflectionFactory.inflationThreshold() && !ReflectUtil.isVMAnonymousClass(this.method.getDeclaringClass())) {
            MethodAccessorImpl var3 = (MethodAccessorImpl)(new MethodAccessorGenerator()).generateMethod(this.method.getDeclaringClass(), this.method.getName(), this.method.getParameterTypes(), this.method.getReturnType(), this.method.getExceptionTypes(), this.method.getModifiers());
            this.parent.setDelegate(var3);
        }

        return invoke0(this.method, var1, var2);
    }

    void setParent(DelegatingMethodAccessorImpl var1) {
        this.parent = var1;
    }

    private static native Object invoke0(Method var0, Object var1, Object[] var2);
}
//ReflectionFactory.inflationThreshold()方法的返回值
private static int inflationThreshold = 15;
```

- 一开始if条件不满足，就会调用本地方法invoke0
- 随着numInvocation的增大，当它大于ReflectionFactory.inflationThreshold的值16时，就会本地方法访问器替换为一个运行时动态生成的访问器，来提高效率
  - 这时会从反射调用变为**正常调用**，即直接调用 Reflect1.foo()

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200614135011.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200614135011.png)



# 五、内存模型



## 1、JAVA内存模型（JMM）

JMM 即 Java Memory Model，它定义了**主存（共享内存）、工作内存（线程私有）**抽象概念，底层对应着 CPU 寄存器、缓存、硬件内存、 CPU 指令优化等。

**JMM体现在以下几个方面**

- 原子性 - 保证指令不会受到线程上下文切换的影响
- 可见性 - 保证指令不会受 cpu 缓存的影响
- 有序性 - 保证指令不会受 cpu 指令并行优化的影响

## 2、可见性

#### 引例

**退出不了的循环**

```java
static Boolean run = true;
	public static void main(String[] args) throws InterruptedException {
		new Thread(()->{
			while (run) {
				//如果run为真，则一直执行
			}
		}).start();

		Thread.sleep(1000);
		System.out.println("改变run的值为false");
		run = false;
	}
```

**为什么无法退出该循环**

- 初始状态， t 线程刚开始从**主内存**读取了 run 的值到**工作内存**。

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145505.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145505.png)

- 因为 t 线程要频繁从主内存中读取 run 的值，JIT 编译器会将 run 的值**缓存至自己工作内存**中的高速缓存中， 减少对主存中 run 的访问，提高效率

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145517.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145517.png)

- 1 秒之后，main 线程修改了 run 的值，并同步至主存，而 t 是从自己工作内存中的高速缓存中读取这个变量 的值，结果永远是**旧值**

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145529.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145529.png)

**解决方法**

- 使用**volatile**易变关键字
- 它可以用来修饰**成员变量**和**静态成员变量**（放在主存中的变量），他可以避免线程从自己的工作缓存中查找变量的值，必须到主存中获取它的值，线程操作 volatile 变量都是**直接操作主存**

```java
//使用易变关键字
volatile static Boolean run = true;
public static void main(String[] args) throws InterruptedException {
	new Thread(()->{
		while (run) {
			//如果run为真，则一直执行
		}
	}).start();

	Thread.sleep(1000);
	System.out.println("改变run的值为false");
	run = false;
}
```

#### 可见性与原子性

前面例子体现的实际就是**可见性**，它保证的是在多个线程之间，一个线程对**volatile变量**的修改对另一个线程可见， **不能**保证原子性，仅用在**一个写**线程，**多个读**线程的情况

- 注意 synchronized 语句块既可以保证代码块的**原子性**，也同时保证代码块内变量的**可见性**。

- 但缺点是 synchronized 是属于**重量级**操作，性能相对更低。

- **如果在前面示例的死循环中加入 System.out.println() 会发现即使不加 volatile 修饰符，线程 t 也能正确看到 对 run 变量的修改了，想一想为什么？**

  - 因为使用了**synchronized**关键字

    ```java
    public void println(String x) {
    		//使用了synchronized关键字
            synchronized (this) {
                print(x);
                newLine();
            }
        }
    ```

#### 两阶终止模式优化

```java
public class Test7 {
	public static void main(String[] args) throws InterruptedException {
		Monitor monitor = new Monitor();
		monitor.start();
		Thread.sleep(3500);
		monitor.stop();
	}
}

class Monitor {

	Thread monitor;
	//设置标记，用于判断是否被终止了
	private volatile boolean stop = false;
	/**
	 * 启动监控器线程
	 */
	public void start() {
		//设置线控器线程，用于监控线程状态
		monitor = new Thread() {
			@Override
			public void run() {
				//开始不停的监控
				while (true) {
					if(stop) {
						System.out.println("处理后续任务");
						break;
					}
					System.out.println("监控器运行中...");
					try {
						//线程休眠
						Thread.sleep(1000);
					} catch (InterruptedException e) {
						System.out.println("被打断了");
					}
				}
			}
		};
		monitor.start();
	}

	/**
	 * 	用于停止监控器线程
	 */
	public void stop() {
		//打断线程
		monitor.interrupt();
        //修改标记
		stop = true;
	}
}
```

#### 同步模式之犹豫模式

**定义**

Balking （犹豫）模式用在一个线程发现另一个线程或本线程**已经做了某一件相同**的事，那么本线程就无需再做 了，**直接结束返回**

- 用一个标记来判断该任务是否已经被执行过了
- 需要避免线程安全问题
  - 加锁的代码块要尽量的小，以保证性能

```java
package com.nyima.day1;

/**
 * @author Chen Panwen
 * @data 2020/3/26 16:11
 */
public class Test7 {
	public static void main(String[] args) throws InterruptedException {
		Monitor monitor = new Monitor();
		monitor.start();
		monitor.start();
		Thread.sleep(3500);
		monitor.stop();
	}
}

class Monitor {

	Thread monitor;
	//设置标记，用于判断是否被终止了
	private volatile boolean stop = false;
	//设置标记，用于判断是否已经启动过了
	private boolean starting = false;
	/**
	 * 启动监控器线程
	 */
	public void start() {
		//上锁，避免多线程运行时出现线程安全问题
		synchronized (this) {
			if (starting) {
				//已被启动，直接返回
				return;
			}
			//启动监视器，改变标记
			starting = true;
		}
		//设置线控器线程，用于监控线程状态
		monitor = new Thread() {
			@Override
			public void run() {
				//开始不停的监控
				while (true) {
					if(stop) {
						System.out.println("处理后续任务");
						break;
					}
					System.out.println("监控器运行中...");
					try {
						//线程休眠
						Thread.sleep(1000);
					} catch (InterruptedException e) {
						System.out.println("被打断了");
					}
				}
			}
		};
		monitor.start();
	}

	/**
	 * 	用于停止监控器线程
	 */
	public void stop() {
		//打断线程
		monitor.interrupt();
		stop = true;
	}
}
```

## 3、有序性

### 指令重排

- JVM 会在**不影响正确性**的前提下，可以**调整**语句的执行**顺序**

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145546.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145546.png)

这种特性称之为『**指令重排**』，**多线程下『指令重排』会影响正确性**。

### 指令重排序优化

- 事实上，现代处理器会设计为一个时钟周期完成一条执行时间长的 CPU 指令。为什么这么做呢？可以想到指令还可以再划分成一个个更小的阶段，例如，每条指令都可以分为： **取指令 - 指令译码 - 执行指令 - 内存访问 - 数据写回** 这5 个阶段

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145615.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145615.png)

- 在不改变程序结果的前提下，这些指令的各个阶段可以通过**重排序**和**组合**来实现**指令级并行**

- 指令重排的前提是，重排指令**不能影响结果**，例如

  ```
  // 可以重排的例子 
  int a = 10; 
  int b = 20; 
  System.out.println( a + b );
  
  // 不能重排的例子 
  int a = 10;
  int b = a - 5;
  ```

### 支持流水线的处理器

现代 CPU 支持多级**指令流水线**，例如支持**同时**执行 **取指令 - 指令译码 - 执行指令 - 内存访问 - 数据写回** 的处理器，就可以称之为五级指令流水线。这时 CPU 可以在一个时钟周期内，同时运行五条指令的不同阶段（相当于一 条执行时间长的复杂指令），IPC = 1，本质上，流水线技术并不能缩短单条指令的执行时间，但它变相地提高了指令地**吞吐率**。

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145602.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145602.png)

**在多线程环境下，指令重排序可能导致出现意料之外的结果**

### 解决办法

**volatile** 修饰的变量，可以**禁用**指令重排

- 禁止的是加volatile关键字变量之前的代码被重排序

## 4、内存屏障

- 可见性
  - **写屏障**（sfence）保证在该屏障**之前**的，对共享变量的改动，都同步到主存当中
  - **读屏障**（lfence）保证在该屏障**之后**，对共享变量的读取，加载的是主存中新数据
- 有序性
  - 写屏障会确保指令重排序时，不会将**写屏障之前**的代码排在写屏障之后
  - 读屏障会确保指令重排序时，不会将**读屏障之后**的代码排在读屏障之前

## 5、volatile 原理

volatile的底层实现原理是**内存屏障**，Memory Barrier（Memory Fence）

- 对 volatile 变量的写指令后会加入写屏障
- 对 volatile 变量的读指令前会加入读屏障

### 如何保证可见性

- 写屏障（sfence）保证在该屏障之前的，对共享变量的改动，都同步到主存当中

  [![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145630.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145630.png)

- 而读屏障（lfence）保证在该屏障之后，对共享变量的读取，加载的是主存中新数据

  [![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145713.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145713.png)

### 如何保证有序性

- 写屏障会确保指令重排序时，不会将写屏障之前的代码排在写屏障之后

  [![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145723.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145723.png)

- 读屏障会确保指令重排序时，不会将读屏障之后的代码排在读屏障之前

  [![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145729.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145729.png)

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145741.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145741.png)

**但是不能解决指令交错问题**

- 写屏障仅仅是保证之后的读能够读到新的结果，但不能保证读跑到它前面去
- 而有序性的保证也只是保证了**本线程内**相关代码不被重排序

### 实现原理之Lock前缀

在X86处理器下通过工具获取JIT编译器生成的汇编指令来查看对volatile进行写操作时

```
instance = new Singleton();
```

对应的汇编代码是

```
... lock addl ...
```

有volatile变量修饰的共享变量进行写操作的时候会多出第二行汇编代码，通过查IA-32架构软件开发者手册可知，**Lock前缀**的指令在多核处理器下会引发了两件事

- Lock前缀指令会引起处理器缓存回写到内存

  - Lock前缀指令导致在执行指令期间，声言处理器的LOCK#信号。在多处理器环境中，LOCK#信号确保在声言该信号期间，处理器可以独占任何共享内存。但是，在最近的处理器里，LOCK #信号一般不锁总线，而是**锁缓存**，毕竟锁总线开销的比较大。使用缓存一致性机制来确保修改的原子性，此操作被称为“缓存锁定”，**缓存一致性机制会阻止同时修改由两个以上处理器缓存的内存区域数据**

- 一个处理器的缓存回写到内存会导致其他处理器的缓存无效

  - 在多核处理器系统中进行操作的时候，IA-32和Intel 64处理器能**嗅探其他处理器访问系统内存和它们的内部缓存**。处理器使用嗅探技术保证它的内部缓存、系统内存和其他处理器的缓存的数据在总线上保持一致

# 五、共享模型之无锁

## 1、无锁解决线程安全问题

- 使用**原子整数**

  ```
  AtomicInteger balance = new AtomicInteger();
  ```

```
interface Account {
	Integer getBalance();

	void withdraw(Integer amount);

	/**
	 * 方法内会启动 1000 个线程，每个线程做 -10 元 的操作     * 如果初始余额为 10000 那么正确的结果应当是 0
	 */
	static void demo(Account account) {
		List<Thread> ts = new ArrayList<>();
		long start = System.nanoTime();
		for (int i = 0; i < 1000; i++) {
			ts.add(new Thread(() -> {
				account.withdraw(10);
			}));
		}
		ts.forEach(Thread::start);
		ts.forEach(t -> {
			try {
				t.join();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		});
		long end = System.nanoTime();
		System.out.println(account.getBalance() + " cost: " + (end - start) / 1000_000 + " ms");
	}
}

//线程不安全的做法
class AccountUnsafe implements Account {
	private Integer balance;

	public AccountUnsafe(Integer balance) {
		this.balance = balance;
	}


	@Override
	public Integer getBalance() {
		return this.balance;
	}

	@Override
	public synchronized void withdraw(Integer amount) {
		balance -= amount;
	}

	public static void main(String[] args) {
		Account.demo(new AccountUnsafe(10000));
		Account.demo(new AccountCas(10000));
	}
}

//线程安全的做法
class AccountCas implements Account {
	//使用原子整数
	private AtomicInteger balance;

	public AccountCas(int balance) {
		this.balance = new AtomicInteger(balance);
	}

	@Override
	public Integer getBalance() {
		//得到原子整数的值
		return balance.get();
	}

	@Override
	public void withdraw(Integer amount) {
		while(true) {
			//获得修改前的值
			int prev = balance.get();
			//获得修改后的值
			int next = prev-amount;
			//比较并设值
			if(balance.compareAndSet(prev, next)) {
				break;
			}
		}
	}
}
```

## 2、CAS与volatile

前面看到的 AtomicInteger 的解决方法，内部并没有用锁来保护共享变量的线程安全。那么它是如何实现的呢？

其中的**关键是 compareAndSwap**（比较并设置值），它的**简称就是 CAS** （也有 Compare And Swap 的说法），它必须是**原子操作**。

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145914.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145914.png)

### **工作流程**

- 当一个线程要去修改Account对象中的值时，先获取值pre（调用get方法），然后再将其设置为新的值next（调用cas方法）。在调用cas方法时，会将pre与Account中的余额进行比较。
  - 如果**两者相等**，就说明该值还未被其他线程修改，此时便可以进行修改操作。
  - 如果**两者不相等**，就不设置值，重新获取值pre（调用get方法），然后再将其设置为新的值next（调用cas方法），直到修改成功为止。

**注意**

- 其实 CAS 的底层是 **lock cmpxchg** 指令（X86 架构），在单核 CPU 和多核 CPU 下都能够保证【比较-交换】的**原子性**。
- 在多核状态下，某个核执行到带 lock 的指令时，CPU 会让总线锁住，当这个核把此指令执行完毕，再开启总线。这个过程中不会被线程的调度机制所打断，保证了多个线程对内存操作的准确性，是原子的。

### volatile

获取共享变量时，为了保证该变量的**可见性**，需要使用 **volatile** 修饰。
它可以用来修饰成员变量和静态成员变量，他可以避免线程从自己的工作缓存中查找变量的值，必须到**主存中获取** 它的值，线程操作 volatile 变量都是直接操作主存。即一个线程对 volatile 变量的修改，对另一个线程可见。

**注意**

```
volatile 仅仅保证了共享变量的可见性，让其它线程能够看到新值，但不能解决指令交错问题（不能保证原子性）
```

**CAS 必须借助 volatile** 才能读取到共享变量的新值来实现【比较并交换】的效果

### 效率问题

一般情况下，使用无锁比使用加锁的**效率更高。**

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145931.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145931.png)

**原因**

### CAS特点

结合 CAS 和 volatile 可以实现**无锁并发**，适用于**线程数少、多核 CPU** 的场景下。

- CAS 是基于**乐观锁**的思想：乐观的估计，不怕别的线程来修改共享变量，就算改了也没关系，我吃亏点再重试呗。

- synchronized 是基于悲观锁的思想：悲观的估计，得防着其它线程来修改共享变量，我上了锁你们都别想改，我改完了解开锁，你们才有机会。

- CAS 体现的是

  无锁并发、无阻塞并发

  ，请仔细体会这两句话的意思

  - 因为没有使用 synchronized，所以线程不会陷入阻塞，这是效率提升的因素之一
  - 但如果竞争激烈，可以想到重试必然频繁发生，反而效率会受影响

## 3、原子整数

J.U.C 并发包提供了

- AtomicBoolean
- AtomicInteger
- AtomicLong

**以 AtomicInteger 为例**

```
 AtomicInteger i = new AtomicInteger(0);
 
// 获取并自增（i = 0, 结果 i = 1, 返回 0），类似于 i++ System.out.println(i.getAndIncrement());
 
// 自增并获取（i = 1, 结果 i = 2, 返回 2），类似于 ++i System.out.println(i.incrementAndGet());
 
// 自减并获取（i = 2, 结果 i = 1, 返回 1），类似于 --i System.out.println(i.decrementAndGet());
 
// 获取并自减（i = 1, 结果 i = 0, 返回 1），类似于 i--
System.out.println(i.getAndDecrement());
 
// 获取并加值（i = 0, 结果 i = 5, 返回 0） 
System.out.println(i.getAndAdd(5));
 
// 加值并获取（i = 5, 结果 i = 0, 返回 0） 
System.out.println(i.addAndGet(-5));
 
// 获取并更新（i = 0, p 为 i 的当前值, 结果 i = -2, 返回 0） 
// 其中函数中的操作能保证原子，但函数需要无副作用 
System.out.println(i.getAndUpdate(p -> p - 2));
 
// 更新并获取（i = -2, p 为 i 的当前值, 结果 i = 0, 返回 0）
// 其中函数中的操作能保证原子，但函数需要无副作用 
System.out.println(i.updateAndGet(p -> p + 2));
 
// 获取并计算（i = 0, p 为 i 的当前值, x 为参数1, 结果 i = 10, 返回 0） 
// 其中函数中的操作能保证原子，但函数需要无副作用 // getAndUpdate 如果在 lambda 中引用了外部的局部变量，要保证该局部变量是 final 的 
// getAndAccumulate 可以通过 参数1 来引用外部的局部变量，但因为其不在 lambda 中因此不必是 
final System.out.println(i.getAndAccumulate(10, (p, x) -> p + x));
 
// 计算并获取（i = 10, p 为 i 的当前值, x 为参数1, 结果 i = 0, 返回 0） 
// 其中函数中的操作能保证原子，但函数需要无副作用
System.out.println(i.accumulateAndGet(-10, (p, x) -> p + x));
```

## 4、原子引用

```
public interface DecimalAccount {
	BigDecimal getBalance();

	void withdraw(BigDecimal amount);

	/**
	 * 方法内会启动 1000 个线程，每个线程做 -10 元 的操作    
     * 如果初始余额为 10000 那么正确的结果应当是 0
	 */
	static void demo(DecimalAccountImpl account) {
		List<Thread> ts = new ArrayList<>();
		long start = System.nanoTime();
		for (int i = 0; i < 1000; i++) {
			ts.add(new Thread(() -> {
				account.withdraw(BigDecimal.TEN);
			}));
		}
		ts.forEach(Thread::start);
		ts.forEach(t -> {
			try {
				t.join();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		});
		long end = System.nanoTime();
		System.out.println(account.getBalance() + " cost: " + (end - start) / 1000_000 + " ms");
	}
}

class DecimalAccountImpl implements DecimalAccount {
	//原子引用，泛型类型为小数类型
	AtomicReference<BigDecimal> balance;

	public DecimalAccountImpl(BigDecimal balance) {
		this.balance = new AtomicReference<BigDecimal>(balance);
	}

	@Override
	public BigDecimal getBalance() {
		return balance.get();
	}

	@Override
	public void withdraw(BigDecimal amount) {
		while(true) {
			BigDecimal pre = balance.get();
			BigDecimal next = pre.subtract(amount);
			if(balance.compareAndSet(pre, next)) {
				break;
			}
		}
	}

	public static void main(String[] args) {
		DecimalAccount.demo(new DecimalAccountImpl(new BigDecimal("10000")));
	}
}
```

## 5、ABA问题

```
public class Demo3 {
	static AtomicReference<String> str = new AtomicReference<>("A");
	public static void main(String[] args) {
		new Thread(() -> {
			String pre = str.get();
			System.out.println("change");
			try {
				other();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
			try {
				Thread.sleep(1000);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
			//把str中的A改为C
			System.out.println("change A->C " + str.compareAndSet(pre, "C"));
		}).start();
	}

	static void other() throws InterruptedException {
		new Thread(()-> {
			System.out.println("change A->B " + str.compareAndSet("A", "B"));
		}).start();
		Thread.sleep(500);
		new Thread(()-> {
			System.out.println("change B->A " + str.compareAndSet("B", "A"));
		}).start();
	}
}
```

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145952.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608145952.png)

主线程仅能判断出共享变量的值与初值 A **是否相同**，不能感知到这种从 A 改为 B 又 改回 A 的情况，如果主线程希望：
只要有其它线程【**动过了**】共享变量，那么自己的 **cas 就算失败**，这时，仅比较值是不够的，需要再加一个**版本号**

### **AtomicStampedReference**

```
public class Demo3 {
	//指定版本号
	static AtomicStampedReference<String> str = new AtomicStampedReference<>("A", 0);
	public static void main(String[] args) {
		new Thread(() -> {
			String pre = str.getReference();
			//获得版本号
			int stamp = str.getStamp();
			System.out.println("change");
			try {
				other();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
			try {
				Thread.sleep(1000);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
			//把str中的A改为C,并比对版本号，如果版本号相同，就执行替换，并让版本号+1
			System.out.println("change A->C stamp " + stamp + str.compareAndSet(pre, "C", stamp, stamp+1));
		}).start();
	}

	static void other() throws InterruptedException {
		new Thread(()-> {
			int stamp = str.getStamp();
			System.out.println("change A->B stamp " + stamp + str.compareAndSet("A", "B", stamp, stamp+1));
		}).start();
		Thread.sleep(500);
		new Thread(()-> {
			int stamp = str.getStamp();
			System.out.println("change B->A stamp " + stamp +  str.compareAndSet("B", "A", stamp, stamp+1));
		}).start();
	}
}
```

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150003.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150003.png)

### AtomicMarkableReference

AtomicStampedReference 可以给原子引用加上版本号，追踪原子引用整个的变化过程，如： A -> B -> A -> C ，通过AtomicStampedReference，我们可以知道，引用变量中途被更改了几次。
但是有时候，并不关心引用变量更改了几次，只是单纯的关心**是否更改过**，所以就有了 **AtomicMarkableReference**

```
public class Demo4 {
	//指定版本号
	static AtomicMarkableReference<String> str = new AtomicMarkableReference<>("A", true);
	public static void main(String[] args) {
		new Thread(() -> {
			String pre = str.getReference();
			System.out.println("change");
			try {
				other();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
			try {
				Thread.sleep(1000);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
			//把str中的A改为C,并比对版本号，如果版本号相同，就执行替换，并让版本号+1
			System.out.println("change A->C mark " +  str.compareAndSet(pre, "C", true, false));
		}).start();
	}

	static void other() throws InterruptedException {
		new Thread(() -> {
			System.out.println("change A->A mark " + str.compareAndSet("A", "A", true, false));
		}).start();
	}
}
```

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150017.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150017.png)

### 两者的区别

- **AtomicStampedReference** 需要我们传入**整型变量**作为版本号，来判定是否被更改过
- **AtomicMarkableReference**需要我们传入**布尔变量**作为标记，来判断是否被更改过

## 6、原子数组

- AtomicIntegerArray
- AtomicLongArray
- AtomicReferenceArray

### lamba表达式的使用

- 提供者
  - 无参又返回
  - ()->返回结果
- 方法
  - 有参有返回
  - (参数一…)->返回结果
- 消费者
  - 有参无返回
  - (参数一…)->void

## 7、原子更新器

- AtomicReferenceFieldUpdater // 域 字段
- AtomicIntegerFieldUpdater
- AtomicLongFieldUpdate

原子更新器用于帮助我们改变某个对象中的某个属性

```
public class Demo1 {
   public static void main(String[] args) {
      Student student = new Student();
       
      // 获得原子更新器
      // 泛型
      // 参数1 持有属性的类 参数2 被更新的属性的类
      // newUpdater中的参数：第三个为属性的名称
      AtomicReferenceFieldUpdater<Student, String> updater = AtomicReferenceFieldUpdater.newUpdater(Student.class, String.class, "name");
       
      // 修改
      updater.compareAndSet(student, null, "Nyima");
      System.out.println(student);
   }
}

class Student {
   volatile String name;

   @Override
   public String toString() {
      return "Student{" +
            "name='" + name + '\'' +
            '}';
   }
}
```

### 原子更新器初始化过程

从上面的例子可以看出，原子更新器是通过newUpdater来获取实例的。其中传入了三个参数

- 拥有属性的类的Class
- 属性的Class
- 属性的名称

大概可以猜出来，**初始化过程用到了反射**，让我们看看源码来验证一下这个猜测。

#### newUpdater方法

```
public static <U,W> AtomicReferenceFieldUpdater<U,W> newUpdater(Class<U> tclass,
                                                                Class<W> vclass,
                                                                String fieldName) {
    // 返回了一个AtomicReferenceFieldUpdaterImpl实例
    return new AtomicReferenceFieldUpdaterImpl<U,W>
        (tclass, vclass, fieldName, Reflection.getCallerClass());
}
```

从newUpdater方法还并不能看出来具体的初始化过程

#### 内部实现类

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20201020145006.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20201020145006.png)

AtomicReferenceFieldUpdater为抽象类，该类**内部有一个自己的实现类AtomicReferenceFieldUpdaterImpl**

```
private static final class AtomicReferenceFieldUpdaterImpl<T,V>
        extends AtomicReferenceFieldUpdater<T,V>
```

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20201020145119.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20201020145119.png)

**构造方法**

```java
AtomicReferenceFieldUpdaterImpl(final Class<T> tclass,
                                final Class<V> vclass,
                                final String fieldName,
                                final Class<?> caller) {
    // 用于保存要被修改的属性
    final Field field;
    
    // 属性的Class
    final Class<?> fieldClass;
    
    // field的修饰符
    final int modifiers;
    try {
        // 反射获得属性
        field = AccessController.doPrivileged(
            new PrivilegedExceptionAction<Field>() {
                public Field run() throws NoSuchFieldException {
                    // tclass为传入的属性的Class，可以通过它来获得属性
                    return tclass.getDeclaredField(fieldName);
                }
            });
        
        // 获得属性的修饰符，主要用于判断
        // 1、vclass 与 属性确切的类型是否匹配
        // 2、是否为引用类型
        // 3、被修改的属性是否加了volatile关键字
        modifiers = field.getModifiers();
        sun.reflect.misc.ReflectUtil.ensureMemberAccess(
            caller, tclass, null, modifiers);
        ClassLoader cl = tclass.getClassLoader();
        ClassLoader ccl = caller.getClassLoader();
        if ((ccl != null) && (ccl != cl) &&
            ((cl == null) || !isAncestor(cl, ccl))) {
            sun.reflect.misc.ReflectUtil.checkPackageAccess(tclass);
        }
        
        // 获得属性类的Class
        fieldClass = field.getType();
    } catch (PrivilegedActionException pae) {
        throw new RuntimeException(pae.getException());
    } catch (Exception ex) {
        throw new RuntimeException(ex);
    }

    if (vclass != fieldClass)
        throw new ClassCastException();
    if (vclass.isPrimitive())
        throw new IllegalArgumentException("Must be reference type");

    if (!Modifier.isVolatile(modifiers))
        throw new IllegalArgumentException("Must be volatile type");

    // Access to protected field members is restricted to receivers only
    // of the accessing class, or one of its subclasses, and the
    // accessing class must in turn be a subclass (or package sibling)
    // of the protected member's defining class.
    // If the updater refers to a protected field of a declaring class
    // outside the current package, the receiver argument will be
    // narrowed to the type of the accessing class.
 	// 对类中的属性进行初始化
    this.cclass = (Modifier.isProtected(modifiers) &&
                   tclass.isAssignableFrom(caller) &&
                   !isSamePackage(tclass, caller))
                  ? caller : tclass;
    this.tclass = tclass;
    this.vclass = vclass;
    // 获得偏移量
    this.offset = U.objectFieldOffset(field);
}
```

**可以看出，原子引用更新器确实使用了反射**

## 8、LongAdder原理

### 原理之伪共享

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150037.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150037.png)

缓存行伪共享得从缓存说起
缓存与内存的速度比较

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150051.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150051.png)

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150102.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150102.png)

因为 CPU 与 内存的速度差异很大，需要靠预读数据至**缓存**来提升效率。
而缓存以**缓存行**为单位，每个缓存行对应着一块内存，一般是 **64 byte**（8 个 long）
缓存的加入会造成数据副本的产生，即同一份数据会缓存在不同核心的缓存行中
CPU 要保证数据的**一致性**，如果某个 CPU 核心**更改**了数据，其它 CPU 核心对应的整个缓存行必须**失效**

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150111.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150111.png)

因为 Cell 是数组形式，在内存中是连续存储的，一个 Cell 为 24 字节（16 字节的对象头和 8 字节的 value），因 此缓存行可以存下 2 个的 Cell 对象。这样问题来了：

- Core-0 要修改 Cell[0]
- Core-1 要修改 Cell[1]

无论谁修改成功，都会导致对方 Core 的缓存行失效，

比如 Core-0 中 Cell[0]=6000, Cell[1]=8000 要累加 Cell[0]=6001, Cell[1]=8000 ，这时会让 Core-1 的缓存行失效

@sun.misc.Contended 用来解决这个问题，它的原理是在使用此注解的对象或字段的**前后各增加 128 字节大小的 padding**（空白），从而让 CPU 将对象预读至缓存时**占用不同的缓存行**，这样，不会造成对方缓存行的失效

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150119.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150119.png)

**累加主要调用以下方法**

```
public void add(long x) {
       Cell[] as; long b, v; int m; Cell a;
       if ((as = cells) != null || !casBase(b = base, b + x)) {
           boolean uncontended = true;
           if (as == null || (m = as.length - 1) < 0 ||
               (a = as[getProbe() & m]) == null ||
               !(uncontended = a.cas(v = a.value, v + x)))
               longAccumulate(x, null, uncontended);
       }
   }
```

**累加流程图**

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150129.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20200608150129.png)

## 9、Unsafe

Unsafe 对象提供了非常底层的，操作内存、线程的方法，Unsafe 对象不能直接调用，只能通过**反射**获得

```
public class GetUnsafe {
	public static void main(String[] args) throws NoSuchMethodException, IllegalAccessException, InvocationTargetException, InstantiationException, NoSuchFieldException {
		// 通过反射获得Unsafe对象
		Class unsafeClass = Unsafe.class;
		// 获得构造函数，Unsafe的构造函数为私有的
		Constructor constructor = unsafeClass.getDeclaredConstructor();
		// 设置为允许访问私有内容
		constructor.setAccessible(true);
		// 创建Unsafe对象
		Unsafe unsafe = (Unsafe) constructor.newInstance();
		
		// 创建Person对象
		Person person = new Person();
		// 获得其属性 name 的偏移量
		Field field = Person.class.getDeclaredField("name");
		long offset = unsafe.objectFieldOffset(field);

		// 通过unsafe的CAS操作改变值
		unsafe.compareAndSwapObject(person, offset, null, "Nyima");
		System.out.println(person);
	}
}

class Person {
    // 配合CAS操作，必须用volatile修饰
 	volatile String name;


	@Override
	public String toString() {
		return "Person{" +
				"name='" + name + '\'' +
				'}';
	}
}
```

# 六、共享模型之不可变

### 1、不可变

如果一个对象在**不能够修**改其内部状态（属性），那么它就是线程安全的，因为不存在并发修改。

### 2、不可变设计

#### String类中不可变的体现

```
public final class String
    implements java.io.Serializable, Comparable<String>, CharSequence {
    /** The value is used for character storage. */
    private final char value[];

    /** Cache the hash code for the string */
    private int hash; // Default to 0
    
   //....
  }
}
```

**ﬁnal 的使用 \**
发现该类、类中所有属性都是 \**ﬁnal** 的

- 属性用 ﬁnal 修饰保证了该属性是只读的，不能修改
- 类用 ﬁnal 修饰保证了该类中的方法不能被覆盖，**防止子类无意间破坏不可变性**

**保护性拷贝 **

但有同学会说，使用字符串时，也有一些跟修改相关的方法啊，比如 substring 等，那么下面就看一看这些方法是 如何实现的，就以 substring 为例

```
public String substring(int beginIndex) {
        if (beginIndex < 0) {
            throw new StringIndexOutOfBoundsException(beginIndex);
        }
        int subLen = value.length - beginIndex;
        if (subLen < 0) {
            throw new StringIndexOutOfBoundsException(subLen);
        }
    	//返回的是一个新的对象
        return (beginIndex == 0) ? this : new String(value, beginIndex, subLen);
    }
```

发现其内部是调用 String 的构造方法**创建了一个新字符串**

```
public String(char value[], int offset, int count) {
        if (offset < 0) {
            throw new StringIndexOutOfBoundsException(offset);
        }
        if (count <= 0) {
            if (count < 0) {
                throw new StringIndexOutOfBoundsException(count);
            }
            if (offset <= value.length) {
                this.value = "".value;
                return;
            }
        }
        // Note: offset or count might be near -1>>>1.
        if (offset > value.length - count) {
            throw new StringIndexOutOfBoundsException(offset + count);
        }
        this.value = Arrays.OfRange(value, offset, offset+count);
    }
```

构造新字符串对象时，会生成新的 char[] value，对内容进行复制 。这种通过创建副本对象来避免共享的手段称之为【**保护性拷贝**（defensive ）】

# 七、线程池

## 1、自定义线程池

### 图解

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20201021154837.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20201021154837.png)

- 阻塞队列中维护了由主线程（或者其他线程）所产生的的任务
- 主线程类似于**生产者**，产生任务并放入阻塞队列中
- 线程池类似于**消费者**，得到阻塞队列中已有的任务并执行

### 代码

```
public class Demo3 {
   public static void main(String[] args) {
      ThreadPool threadPool = new ThreadPool(2,  TimeUnit.SECONDS, 1, 4);
      for (int i = 0; i < 10; i++) {
         threadPool.execute(()->{
            try {
               TimeUnit.SECONDS.sleep(10000);
            } catch (InterruptedException e) {
               e.printStackTrace();
            }
            System.out.println("任务正在执行!");
         });
      }
   }
}


/**
 * 自定义线程池
 */
class ThreadPool {
   /**
    * 自定义阻塞队列
    */
   private BlockingQueue<Runnable> blockingQueue;

   /**
    * 核心线程数
    */
   private int coreSize;

   private HashSet<Worker> workers = new HashSet<>();

   /**
    * 用于指定线程最大存活时间
    */
   private TimeUnit timeUnit;
   private long timeout;

   /**
    * 工作线程类
    * 内部封装了Thread类，并且添加了一些属性
    */
   private class Worker extends Thread {
      Runnable task;

      public Worker(Runnable task) {
         System.out.println("初始化任务");
         this.task = task;
      }

      @Override
      public void run() {
         // 如果有任务就执行
         // 如果阻塞队列中有任务，就继续执行
         while (task != null || (task = blockingQueue.take()) != null) {
            try {
               System.out.println("执行任务");
               task.run();
            } catch (Exception e) {
               e.printStackTrace();
            } finally {
               // 任务执行完毕，设为空
               System.out.println("任务执行完毕");
               task = null;
            }
         }
         // 移除任务
         synchronized (workers) {
            System.out.println("移除任务");
            workers.remove(this);
         }
      }
   }

   public ThreadPool(int coreSize, TimeUnit timeUnit, long timeout, int capacity) {
      this.coreSize = coreSize;
      this.timeUnit = timeUnit;
      blockingQueue = new BlockingQueue<>(capacity);
      this.timeout = timeout;
   }

   public void execute(Runnable task) {
      synchronized (workers) {
         // 创建任务
         // 池中还有空余线程时，可以运行任务
         // 否则阻塞
         if (workers.size() < coreSize) {
            Worker worker = new Worker(task);
            workers.add(worker);
            worker.start();
         } else {
            System.out.println("线程池中线程已用完，请稍等");
            blockingQueue.put(task);
         }
      }
   }
}

/**
 * 阻塞队列
 * 用于存放主线程或其他线程产生的任务
 */
class BlockingQueue<T> {
   /**
    * 阻塞队列
    */
   private  Deque<T> blockingQueue;

   /**
    * 阻塞队列容量
    */
   private int capacity;

   /**
    * 锁
    */
   private ReentrantLock lock;

   /**
    * 条件队列
    */
   private Condition fullQueue;
   private Condition emptyQueue;


   public BlockingQueue(int capacity) {
      blockingQueue = new ArrayDeque<>(capacity);
      lock = new ReentrantLock();
      fullQueue = lock.newCondition();
      emptyQueue = lock.newCondition();
      this.capacity = capacity;
   }

   /**
    * 获取任务的方法
    */
   public T take() {
      // 加锁
      lock.lock();
      try {
         // 如果阻塞队列为空（没有任务），就一直等待
         while (blockingQueue.isEmpty()) {
            try {
               emptyQueue.await();
            } catch (InterruptedException e) {
               e.printStackTrace();
            }
         }
         // 获取任务并唤醒生产者线程
         T task = blockingQueue.removeFirst();
         fullQueue.signalAll();
         return task;
      } finally {
         lock.unlock();
      }
   }

   public T takeNanos(long timeout, TimeUnit unit) {
      // 转换等待时间
      lock.lock();
      try {
         long nanos = unit.toNanos(timeout);
         while (blockingQueue.isEmpty()) {
            try {
               // awaitNanos会返回剩下的等待时间
               nanos = emptyQueue.awaitNanos(nanos);
               if (nanos < 0) {
                  return null;
               }
            } catch (InterruptedException e) {
               e.printStackTrace();
            }
         }
         T task = blockingQueue.removeFirst();
         fullQueue.signalAll();
         return task;
      } finally {
         lock.unlock();
      }
   }

   /**
    * 放入任务的方法
    * @param task 放入阻塞队列的任务
    */
   public void put(T task) {
      lock.lock();
      try {
         while (blockingQueue.size() == capacity) {
            try {
               System.out.println("阻塞队列已满");
               fullQueue.await();
            } catch (InterruptedException e) {
               e.printStackTrace();
            }
         }
         blockingQueue.add(task);
         // 唤醒等待的消费者
         emptyQueue.signalAll();
      } finally {
         lock.unlock();
      }
   }

   public int getSize() {
      lock.lock();
      try {
         return blockingQueue.size();
      } finally {
         lock.unlock();
      }
   }
}
```

实现了一个简单的线程池

- 阻塞队列BlockingQueue用于暂存来不及被线程执行的任务
  - 也可以说是平衡生产者和消费者执行速度上的差异
  - 里面的获取任务和放入任务用到了**生产者消费者模式**
- 线程池中对线程Thread进行了再次的封装，封装为了Worker
  - 在调用任务的run方法时，线程会去执行该任务，执行完毕后还会**到阻塞队列中获取新任务来执行**
- 线程池中执行任务的主要方法为execute方法
  - 执行时要判断正在执行的线程数是否大于了线程池容量

## 2、ThreadPoolExecutor

### 继承关系

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20201022212832.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20201022212832.png)

### 线程池状态

```
// 线程池状态
// runState is stored in the high-order bits
// RUNNING 高3位为111
private static final int RUNNING    = -1 << COUNT_BITS;

// SHUTDOWN 高3位为000
private static final int SHUTDOWN   =  0 << COUNT_BITS;

// 高3位 001
private static final int STOP       =  1 << COUNT_BITS;

// 高3位 010
private static final int TIDYING    =  2 << COUNT_BITS;

// 高3位 011
private static final int TERMINATED =  3 << COUNT_BITS;
```

| 状态名称   | 高3位的值 | 描述                                          |
| ---------- | --------- | --------------------------------------------- |
| RUNNING    | 111       | 接收新任务，同时处理任务队列中的任务          |
| SHUTDOWN   | 000       | 不接受新任务，但是处理任务队列中的任务        |
| STOP       | 001       | 中断正在执行的任务，同时抛弃阻塞队列中的任务  |
| TIDYING    | 010       | 任务执行完毕，活动线程为0时，即将进入终结阶段 |
| TERMINATED | 011       | 终结状态                                      |

线程池状态和线程池中线程的数量**由一个原子整型ctl来共同表示**

- 使用一个数来表示两个值的主要原因是：**可以通过一次CAS同时更改两个属性的值**

```
// 原子整数，前3位保存了线程池的状态，剩余位保存的是线程数量
private final AtomicInteger ctl = new AtomicInteger(ctlOf(RUNNING, 0));

// 并不是所有平台的int都是32位。
// 去掉前三位保存线程状态的位数，剩下的用于保存线程数量
// 高3位为0，剩余位数全为1
private static final int COUNT_BITS = Integer.SIZE - 3;

// 2^COUNT_BITS次方，表示可以保存的最大线程数
// CAPACITY 的高3位为 0
private static final int CAPACITY   = (1 << COUNT_BITS) - 1;
```

获取线程池状态、线程数量以及合并两个值的操作

```
// Packing and unpacking ctl
// 获取运行状态
// 该操作会让除高3位以外的数全部变为0
private static int runStateOf(int c)     { return c & ~CAPACITY; }

// 获取运行线程数
// 该操作会让高3位为0
private static int workerCountOf(int c)  { return c & CAPACITY; }

// 计算ctl新值
private static int ctlOf(int rs, int wc) { return rs | wc; }
```

### 线程池属性

```
// 工作线程，内部封装了Thread
private final class Worker
        extends AbstractQueuedSynchronizer
        implements Runnable {
    ...
}

// 阻塞队列，用于存放来不及被核心线程执行的任务
private final BlockingQueue<Runnable> workQueue;

// 锁
private final ReentrantLock mainLock = new ReentrantLock();

//  用于存放核心线程的容器，只有当持有锁时才能够获取其中的元素（核心线程）
private final HashSet<Worker> workers = new HashSet<Worker>();
```

### 构造方法极其参数

**ThreadPoolExecutor最全面的构造方法**

也是构造自定义线程池的方法

```
public ThreadPoolExecutor(int corePoolSize,
                          int maximumPoolSize,
                          long keepAliveTime,
                          TimeUnit unit,
                          BlockingQueue<Runnable> workQueue,
                          ThreadFactory threadFactory,
                          RejectedExecutionHandler handler)
```

#### **参数解释**

- corePoolSize：核心线程数
- maximumPoolSize：最大线程数
  - maximumPoolSize - corePoolSize = 救急线程数
- keepAliveTime：救急线程空闲时的最大生存时间
- unit：时间单位
- workQueue：阻塞队列（存放任务）
  - 有界阻塞队列 ArrayBlockingQueue
  - 无界阻塞队列 LinkedBlockingQueue
  - 最多只有一个同步元素的 SynchronousQueue
  - 优先队列 PriorityBlockingQueue
- threadFactory：线程工厂（给线程取名字）
- handler：拒绝策略

#### 工作方式

- 当一个任务传给线程池以后，可能有以下几种可能
  - 将任务分配给一个核心线程来执行
  - 核心线程都在执行任务，将任务放到阻塞队列workQueue中等待被执行
  - 阻塞队列满了，使用救急线程来执行任务
    - 救急线程用完以后，超过生存时间（keepAliveTime）后会被释放
  - 任务总数大于了 最大线程数（maximumPoolSize）与阻塞队列容量的最大值（workQueue.capacity），使用拒接策略

#### 拒绝策略

如果线程到达 maximumPoolSize 仍然有新任务这时会执行**拒绝策略**。拒绝策略 jdk 提供了 4 种实现

[![img](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20201022194718.png)](https://nyimapicture.oss-cn-beijing.aliyuncs.com/img/20201022194718.png)

- AbortPolicy：让调用者抛出 RejectedExecutionException 异常，**这是默认策略**
- CallerRunsPolicy：让调用者运行任务
- DiscardPolicy：放弃本次任务
- DiscardOldestPolicy：放弃队列中最早的任务，本任务取而代之

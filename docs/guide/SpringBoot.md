# SpringBoot

Springboot的特点：约定大于配置。

Spring Boot Starter 在启动的过程中会根据约定的信息对资源进行初始化。

## 启动原理

1. Spring Boot 在启动时会去依赖的 Starter 包中寻找 resources/META-INF/spring.factories 文件，然后根据文件中配置的 Jar 包名去扫描对应的 Jar 包。

2. 根据 spring.factories 配置加载 AutoConfigure 类。

3. 根据 @Conditional 注解的条件，进行自动配置并将 Bean 注入 Spring Context

## 日志

### 用 logback-spring.xml 管理日志并配置颜色

颜色配置类

```java
package cn.donglq.magic.config;


import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.pattern.color.ANSIConstants;
import ch.qos.logback.core.pattern.color.ForegroundCompositeConverterBase;

/**
 * @author LongQin Dong
 * @date 2021-07-06
 */
public class LogbackColorful extends ForegroundCompositeConverterBase<ILoggingEvent> {

    @Override
    protected String getForegroundColorCode(ILoggingEvent event) {
        Level level = event.getLevel();
        switch (level.toInt()) {
            //ERROR等级为红色
            case Level.ERROR_INT:
                return ANSIConstants.BOLD + ANSIConstants.RED_FG;
            //WARN等级为黄色
            case Level.WARN_INT:
                return ANSIConstants.BOLD + ANSIConstants.YELLOW_FG;
            //INFO等级为蓝色
            case Level.INFO_INT:
                return ANSIConstants.BOLD + ANSIConstants.BLUE_FG;
            //DEBUG等级为绿色
            case Level.DEBUG_INT:
                return ANSIConstants.BOLD + ANSIConstants.GREEN_FG;
            //其他为默认颜色
            default:
                return ANSIConstants.BOLD + ANSIConstants.DEFAULT_FG;
        }
    }
}
```

logback-spring.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>

    <!--自定义颜色配置-->
    <conversionRule conversionWord="customcolor" converterClass="cn.donglq.magic.config.LogbackColorful"/>

    <!-- %m输出的信息,%p日志级别,%t线程名,%d日期,%c类的全名,%i索引【从数字0开始递增】,,, -->
    <!-- appender是configuration的子节点，是负责写日志的组件。 -->
    <!-- ConsoleAppender：把日志输出到控制台 -->
    <!-- 加粗只需在前面加bold，后面紧接着的第一个字母大写，就可以了，比如下面的 boldMagenta -->
    <appender name="console" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>
%d{HH:mm:ss.SSS} %cyan([%-20.20thread{20}]) %customcolor(%-5level) %boldMagenta(%-40.40logger{40}) : %msg%n
            </pattern>
            <!-- 控制台也要使用UTF-8，不要使用GBK，否则会中文乱码 -->
            <charset>UTF-8</charset>
        </encoder>
    </appender>

    <!-- RollingFileAppender：滚动记录文件，先将日志记录到指定文件，当符合某个条件时，将日志记录到其他文件 -->
    <!-- 1.先按日期存日志，日期变了，将前一天的日志文件名重命名为XXX%日期%索引，新的日志仍然是system.log -->
    <!-- 2.如果日期没有发生变化，但是当前日志的文件大小超过1KB时，对当前日志进行分割 重命名-->
    <appender name="log_file" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <!--如果只是想要 Error 级别的日志，那么需要过滤一下，默认是 info 级别的，ThresholdFilter-->
        <filter class="ch.qos.logback.classic.filter.ThresholdFilter">
            <level>INFO</level>
        </filter>
        <File>logs/system.log</File>
        <!-- rollingPolicy:当发生滚动时，决定 RollingFileAppender 的行为，涉及文件移动和重命名。 -->
        <!-- TimeBasedRollingPolicy： 最常用的滚动策略，它根据时间来制定滚动策略，既负责滚动也负责出发滚动 -->
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <!-- 活动文件的名字会根据fileNamePattern的值，每隔一段时间改变一次 -->
            <!-- 文件名：log/demo.2018-06-23.0.log -->
            <fileNamePattern>logs/system.%d.%i.log</fileNamePattern>
            <!-- 每产生一个日志文件，该日志文件的保存期限为30天 -->
            <maxHistory>30</maxHistory>
            <timeBasedFileNamingAndTriggeringPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedFNATP">
                <!-- maxFileSize:这是活动文件的大小，默认值是10MB，测试时可改成1KB看效果 -->
                <maxFileSize>10MB</maxFileSize>
            </timeBasedFileNamingAndTriggeringPolicy>
        </rollingPolicy>
        <encoder>
            <!-- pattern节点，用来设置日志的输入格式 -->
            <pattern>
            %d{yyyy-MM-dd HH:mm:ss.SSS} [%-30.30thread{30}] %-5level %-40.40logger{40} : %msg%n
            </pattern>
            <!-- 记录日志的编码:此处设置字符集 - -->
            <charset>UTF-8</charset>
        </encoder>
    </appender>

    <!-- 指定项目中某个包，当有日志操作行为时的日志记录级别 -->
    <!-- 级别依次为【从高到低】：FATAL > ERROR > WARN > INFO > DEBUG > TRACE  -->
    <!-- additivity=false 表示匹配之后，不再继续传递给其他的logger-->
    <!--<logger name="org.apache.coyote" level="DEBUG" additivity="false">-->
    <!--    <appender-ref ref="console"/>-->
    <!--</logger>-->

    <!-- 此处配合运行环境配置 -->
    <springProfile name="dev">
        <logger name="org.apache.coyote" level="DEBUG" additivity="false">
            <appender-ref ref="console"/>
        </logger>

        <!-- 控制台输出日志级别 -->
        <root level="INFO">
            <appender-ref ref="console"/>
        </root>
    </springProfile>

    <springProfile name="test,prod">
        <!-- 控制台输出日志级别 -->
        <root level="INFO">
            <appender-ref ref="console"/>
            <appender-ref ref="log_file"/>
        </root>
    </springProfile>

    <!-- 控制台输出日志级别 -->
    <!--<root level="INFO">-->
    <!--    <appender-ref ref="console"/>-->
    <!--    <appender-ref ref="log_file"/>-->
    <!--</root>-->
</configuration>
```




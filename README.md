[![Travis CI](https://travis-ci.org/robertkeizer/rabbit-pipe.svg?branch=master)](https://travis-ci.org/robertkeizer/rabbit-pipe)

## Overview

Allows interaction between a unix pipe and a rabbit queue. Useful for parallization across hosts.

## Installation

```
npm install -g rabbit-pipe
```

## Usage

```
  Usage: rabbit-pipe [options]

  Options:

    -V, --version                     output the version number
    -q, --queue <queue>               Queue name to use
    -P, --producer                    Signal that we're producing
    -C, --consumer                    Signal that we should consume
    -l, --queue-length [queuelength]  Maximum number of items in the queue
    -f, --queue-freq [queuefreq]      How often to check the queue length (ms)
    -H, --host [host]                 Rabbit host to use (default: localhost)
    -u, --user [user]                 User to use for connecting to RabbitMQ
    -p, --pass [pass]                 Pass to use for connecting to RabbitMQ
    -n, --num [num]                   Number of messages to grab concurrently ( prefetch in rabbit parlance )
    -h, --help                        output usage information
```

## Examples

### Producer

**Example**: Put each IPv4 address in a queue; Limits queue length to 1000, and checks the queue length every 100ms.
```
$ masscan 0.0.0.0/0 -sL | rabbit-pipe -P -q ips -l 1000 -f 100
```

**Example**: Put each filename into a rabbit queue named `files`. Try and keep a limit of 1000 messages in the queue at one time, and check the queue length every 100ms.
```
$ find / -type f | rabbit-pipe -P -q files -l 1000 -f 100
```

**Example**: Generate the sha512 hashes of each file on disk and send them to a queue named `hashes`. Limit to 10000 messages in the queue at once, and check the queue length every second.
```
$ find / -type f 2>/dev/null | xargs -I{} shasum -a 512 {} 2>/dev/null | awk '{print $1}' | rabbit-pipe -P -q hashes -l 10000 -f 1000
```

**Example**: Watch a file ( syslog ) and send each line to a queue named `syslog`. Limit to 1000 messages in the queue, confirm the length of the queue once each second, and login to the RabbitMQ host with the credentials `someuser` and `somepass`.
```
$ tail -f /var/log/syslog | rabbit-pipe -P -q syslog -l 1000 -f 1000 -u someuser -p somepass
```

### Consumer
**Example**: Read from a queue of ips and see if you can ping that address.
```
$ rabbit-pipe -C -q ips | xargs -I{} ping -c 1 {}
```

**Example**: Read filenames or urls from a queue, execute `mplayer <file|url>`.
```
$ rabbit-pipe -C -q music | xargs -I{} mplayer {}
```

**Example**: Read log lines from a log queue, append them to a file.
```
$ rabbit-pipe -C -q logs >> ./log-from-rabbit.log
```

**Example**: Read bad words from a queue and see if they exist in git commit history. Grab 100 words at a time.
```
$ rabbit-pipe -C -q badwords -n 100 | xargs -I{} git log --grep {}
```

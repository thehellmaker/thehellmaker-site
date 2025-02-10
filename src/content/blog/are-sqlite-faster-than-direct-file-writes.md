---
title: 'Are SQLite INSERTS faster than direct file writes?'
description: "A standard benchmark by SQLite team shows SQLite INSERTS are 35% faster than direct filesystem writes. I explore the nuances of this blog"
pubDate: 'Jan 31 2025'
tags: 'os, database'
group: 'systems'
heroImage: '/blog-placeholder-3.jpg'
authors: ['thehellmaker']
---

## Introduction
When SQLite boldly claims that SQLite operations outperforms direct file operations upto 35%, it raises eyebrows. After all, operations to/from a file without the overhead of a database sounds like it should be faster by design. Intrigued by this assertion from SQLite's blog post, ["Faster Than the Filesystem"](https://www.sqlite.org/fasterthanfs.html), I decided to dig deeper into the WRITE aspect of the comparison. 

I benchmarked SQLite against direct file writes using a simple and controlled setup, stripping away all unnecessary fluff. Along the way, I discovered insights into how SQLite manages its writes in WAL Mode. This blog is a detailed account of my findings, where I discuss the setup, experiments, challenges, and results which show that direct filesystem writes are indeed faster than INSERTS into direct file.

## Background
When a files are written into by an application Linux doesn't directly write the files to the Secondary Storage. It writes it to an in-memory buffer called the page cache a.k.a disk cache. The goal of this cache is to minimize disk I/O by storing data in RAM that would otherwise require disk access.


| ![image info](/databaseandosbuffers.drawio.png) |
|:--:|
| **Figure 1:** OS Page Cache, Database Pages and Secondary Storage |

Similar to page cache by OS, different databases often implement maintain their own in-memory buffers called pages which are used for further optimization of database I/O ([sequential and random I/O](https://vivekbansal.substack.com/p/sequential-vs-random-io)).

## Experiment 1 (Establish baseline)
This experiment aims to compare the time taken to write 100k, 1M, and 10M rows directly into files and into SQLite database. In both cases the test is as shown below

### File write
Quoted verbatim from the blog ["Faster Than the Filesystem"](https://www.sqlite.org/fasterthanfs.html)

> The direct-to-disk writes are accomplished using fopen()/fwrite()/fclose().  By default, and in all the results shown below, the OS filesystem buffers are never flushed to persistent storage using fsync() or FlushFileBuffers(). In 
> other words, there is no attempt to make the direct-to-disk writes transactional or power-safe. We found that invoking fsync() or FlushFileBuffers() on each file written causes direct-to-disk storage to be about 10 times or more > 
> slower than writes to SQLite.


The above translates to pseudo-code 
```
startTime = now()
file = openFile()
for i in range(1, 1000000):
    file.writeToFile(f"test{i}")
closeFile()
endTime = now()
print ("Time taken for 1000000 writes =", endTime-startTime)
```

### SQLite Inserts

The table DDL is 
```
CREATE TABLE IF NOT EXISTS log(logline text)
```
Quoted verbatim from the blog ["Faster Than the Filesystem"](https://www.sqlite.org/fasterthanfs.html)
> SQLite database updates are in WAL mode against raw direct-to-disk overwrites of separate files on disk. The PRAGMA synchronous setting is NORMAL. 
> All database writes are in a single transaction. The timer for the database writes is stopped after the transaction commits, but before a checkpoint 
> is run. Note that the SQLite writes, unlike the direct-to-disk writes, are transactional and power-safe, though because the synchronous setting is NORMAL 
> instead of FULL, the transactions are not durable.

The above translates to pseudo-code 
```
conn = openSQLiteConnection(
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
)
startTime = now()
transaction = conn.createTransaction()
preparedStatement = transaction.createStatement("INSERT INTO log (logline) VALUES ($1)")
for i in range(1, 1000000):
    preparedStatement.execute(f"test{i}")
transaction.commit()
endTime = now()
print ("Time taken for 1000000 writes =", endTime-startTime)
conn.close()
```

### Comparison

> Time taken for SQLite writes = 2493 ms                                      
> Time taken for direct file writes = 8062 ms


WTF? It indeed looks like writes to direct file are taking more time than SQLite. The linux kernel doesn't offer any more optimizations than this. It offers fwrite() and fsync(). Currently in our experiment we are not calling fsync anywhere. fwrite is the best that is possible which writes to OS Page cache first. It doesn't fsync either until page is full or periodically. And in both cases we are doing sequential writes. In SQLite, like other databases, all writes are persisted to WAL and only write to DB pages during checkpointing. In direct file writes we are just writing the strings sequentially. If both are doing sequential writes and writing to page cache shouldn't they perform the same? Then what is happening here?

If transaction commits to ensure durability need to sync the file to secondary storage. However this is dependent completely dependent on the [PRAGMA synchronous](https://www.sqlite.org/pragma.html#pragma_synchronous) directive. According to the documentation when synchronous=NORMAl the data might still not be syncd to secondary storage, but will definitely reside in page cache(OS disk buffer). This means that a power failure can rollback a transaction if 
the power failure occurs before OS page cache is flushed to the disk. To achieve durability with the transaction PRAGMA synchronous = FULL or EXTRA.

But that's beside the point because it's the same behaviour with fclose(), the data might not be flushed to the secondary storage on fclose(). They both should still perform the same right? At this point I wasn't able to come up with any theories other than SQLite should be keeping data in memory and not really writing to the file at all. To test this I decided to turn the *synchronouse=EXTRA* (just to eliminate other factors) and check the WAL file white the write is going on. When I checked the *.db-wal file during the writes the file size remained 0 bytes throughout and it was empty. 

This kind of confirmed that I was going in the right direction but I wasn't satisfied with the answer for 2 reasons
- If SQLite is keeping data in memory even after a transaction commit then its not durable at all. 
- I was checked if the DB is writing to the file by doing watch on du -shc * command which is super naive. 

First thing I decide to tail the WAL and then run the script. 
```
tail -f expt2.db-wal
```

I expected to see nothign as I was thinking SQLite is not writing to the DB at all and keeping it all in memory. But when I ran the script I saw that all the data that was written to SQLite came into the WAL, But there were 2 interesting things that happened here
- There was a delay before which the log appeared. I wasn't sure if this was the script warmup time or there was an actual delay as it was all under 2-2.5s. 
- The .db-wal file was again empty after the script ended. This mean that SQLite was checkpointing the data during closing of SQLite connection.


## Experiment 2 (Check if SQLite is buferring in memory)
I wanted to be doubly sure that SQLite was actually buffering data in memory during writes within a transaction so I decided to increase the looping to 10000000 and sleep for 20 seconds post every 1000000 writes and see during that time are there any WAL writes. VOILA there were no writes until some 800k writes which means that SQLite is buffering all writes in memory either until transaction commit happens or until some buffer is full. It gets even better
- When the buffer gets full and the next 1000000 writes happen it doesn't fully flush its entire buffer to disk. Even though WAL is in binary format, the data was still in plain text I kept a track of max(i) in the "test{i}" that was written to the WAL every 1000000 writes and did a diff of max(i(n)) - max(i(n-1)) where i is the serial number of our loop and n and n-1 are the 2 runs of the loop before and after sleep. This diff that was getting written to WAL was exactly 1000000 on every successive 1000000 writes. 
- The time it takes to write 1000000 while it was writing to in memory buffer was similar (2000 - 2500ms) and did not change after it started flusing to WAL. Which means that the thread that was flushing this buffer data to WAL was different from the thread that was writing into the buffer else the write time should have increased once the buffer was full.

The pseudo code for this experiment 

```
conn = openSQLiteConnection(
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = EXTRA;
)
transaction = conn.createTransaction()
preparedStatement = transaction.createStatement("INSERT INTO log (logline) VALUES ($1)")
startTime = now()
for i in range(1, 10000000):
    preparedStatement.execute(f"test{i}")
    if i % 1000000 == 0:
        endTime = now()
        print ("Time taken for 1000000 writes =", endTime-startTime)
        sleep(20s)
        startTime = now()
transaction.commit()
conn.close()
```

## Experiment 3 (In memory buffering for direct to file writes)
Lastly I wanted to do the most obvious thing and modify direct file writes to keep data in memory and only write to the file at the end of the loop as shown below. 


This was obviously wayyyy faster than even SQLite. 

> Time taken for direct file writes = 390ms

## Conclusing (SQLite does inmemory buffering of the data to make it look like its faster)
SQLite indeed has some optimizations by buffering data in memory before even writing to a files and it would write data to file in a Queue fashion using multiple threads which makes it look like its faster than direct to file writes but not true in reality. However it does ensure durability at a transaction level with PRAGMA synchronous = FULL.

Thanks for reading. Hope you enjoyed it. The code for all the experiments are written in Rust and can be found [here](https://github.com/thehellmaker/systems-experiments/tree/main/sqlite-vs-direct-file-write).








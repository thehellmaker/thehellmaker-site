---
title: 'Why is writing to WAL (Write Ahead Log) faster than DB writes?'
description: "Databases often write to WAL, on single or multiple machines, and then return to the clients confirming the writes. How is writing to WAL durable and why is it faster than writing to database?"
pubDate: 'Feb 2 2025'
tags: 'os, database'
group: 'systems'
heroImage: '/blog-placeholder-3.jpg'
authors: ['thehellmaker']
---

## Introduction
Databases rely on Write-Ahead Logging (WAL) to ensure durability and performance. When a database processes a write request, it often appends the change to a sequential log called WAL before applying it to the actual database storage. This approach enables databases to acknowledge writes faster, ensuring both durability and performance. 

| ![image info](/WALBeforeDBUpdate.excalidraw.png) |
|:--:|
| **[Figure 1](/WALBeforeDBUpdate.excalidraw):** First update WAL and then update DB |

## How is it faster than direct writes to db files?
Writes to a WAL is Faster than writes to DB for the following reasons
1. Writes to WAL are sequential append only log writes and sequential writes are faster than random writes for both [HDD](https://vivekbansal.substack.com/p/sequential-vs-random-io) and SSD. Where as writes to DB will involve random writes which is much slower.
2. Writes to DB also involve updating the Index datastructures like B-Trees or B+-Trees which are O(log(n)) operations compared to append operation which is O(1). Secondly they also involving balancing the datastructures
to ensure the complexity of insertion and fetch remain O(log n).

### Why do write to database result in random writes?
A database consists of multiple components, each stored at different locations on disk. A single write operation may involve updating:

1. Data Pages (Table Storage) – Where the actual row is stored.
2. Index Pages – If an indexed column is modified, the corresponding index structure (e.g., B-tree) must be updated.
3. Transaction Logs & Undo Logs – Some databases store an "undo" log for rollback purposes.
4. Metadata & MVCC (Multi-Version Concurrency Control) – If using MVCC, old row versions are retained, and new versions are written elsewhere.

Since these structures reside in different locations on disk, writes do not happen in a single continuous region. Instead, they occur in multiple scattered locations, leading to random disk writes.

#### Example
Let's analyze a simple example where three records in a database are updated. Figure 2 visually represents how these updates impact disk I/O, highlighting the stark contrast between sequential WAL writes and random database writes. 

Consider an application performing the following update operations:

1. **UPDATE (1, Srinag, Address1.1)** – Updating the address of the record with ID 1.

2. **UPDATE (2, Sharan, Address2.1)** – Updating the address of the record with ID 2.

3. **UPDATE (3, Sindhu, Address3.1)** – Updating the address of the record with ID 3.

| ![image info](/DBSequentialvsRandomIO.excalidraw.png) |
|:--:|
| **[Figure 2](/DBSequentialvsRandomIO.excalidraw):** First update WAL and then update DB |

##### How these updates are handled in WAL
When these updates are executed, they are first appended sequentially to the WAL file:
```
(1, Srinag, Address1.1)
(2, Sharan, Address2.1)
(3, Sindhu, Address3.1)
```

The WAL entries are written sequentially to disk in batches, reducing disk seek times and improving write performance. Since WAL is a simple log file, new updates are simply appended at the end without requiring modifications to existing entries.

##### How these updates are handled in the database

In contrast, updating records directly in the database requires modifying multiple components:

1. **Database Page Writes**

* The pages containing records for Srinag, Sharan, and Sindhu need to be modified.

* Since different records belong to different pages, the disk must perform random writes.

2. **Index Updates**

* If indexed columns are modified, the B+ Tree index must be updated, causing additional random writes.

3. **Metadata Updates**

* Transactional information (such as row versions, commit logs, or constraint checks) must be updated in metadata files.

* Metadata files are stored separately from data pages, leading to additional disk seeks.

Each update operation must:

1. Locate and load the correct database page in memory.

2. Modify the required fields.

3. Write the modified pages back to disk.

4. Update the index structures.

5. Modify transaction metadata to ensure durability.

These updates occur at different locations on disk, leading to random writes which are more timeconsuming and inefficient compared to sequential append only I/O. This is also shown in Figure 2. where the single primary write to WAL leads to multiple auxilliary writes to other pages in the databases.

## Is WAL always faster?

While WAL is generally faster for write-heavy workloads, it may not always be the best choice in the below scenario:

1. **Read-Heavy Workloads** Since changes are applied asynchronously, reading recent writes might involve scanning both WAL and the main database.

2. **Frequent Checkpoints** Databases periodically flush WAL data to the main storage, and poorly optimized checkpointing can cause performance bottlenecks.

3. **Very Large Transactions** WAL must keep track of all uncommitted changes, which can consume significant disk space if transactions are large.

## Conclusion

Writing to WAL is faster than direct database writes primarily due to sequential disk writes, batching efficiency, and reduced locking overhead. This approach ensures durability, crash recovery, and better performance in write-intensive applications. However, optimal WAL configuration and checkpoint tuning are essential for maintaining performance balance.

For databases like PostgreSQL, SQLite, and MySQL (with InnoDB), WAL is a crucial feature that enables efficient transaction processing while ensuring data integrity.
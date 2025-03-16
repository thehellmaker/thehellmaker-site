## Understanding WAL

### How WAL Ensures Durability
Imagine a simple transaction:
1. A user updates a record in a database.
2. The change is appended to the WAL.
3. The WAL is flushed to disk, ensuring the change is safely stored.
4. The system crashes before the change is applied to the database.
5. On restart, the database replays the WAL to restore the last committed state.

```pgsql
+-------------------+
| User writes data |
+-------------------+
        |
        v
+-------------------+
| Append to WAL    |
+-------------------+
        |
        v
+-------------------+
| Flush WAL to disk|
+-------------------+
        |
        v
+-------------------+
| DB crash or power failure occurs  |
+-------------------+
        |
        v
+-------------------+
| Replay WAL       |
+-------------------+
        |
        v
+-------------------+
| Data Restored    |
+-------------------+
```
This process ensures that even in the event of a system failure, all committed transactions are not lost.


### Multiple Updates in a Transaction with DB Crash or Power Failure (Including Commit Message)
In a typical database transaction, a COMMIT message is written to the WAL after all the changes are made. This message signifies that the transaction is complete and should be applied to the main database storage. If a crash occurs before the commit is logged, the transaction is considered incomplete, and the database can use the WAL to identify and roll back any changes from incomplete transactions.

Transaction Scenario:

1. **Update Table 1** - The first update modifies a record in the first table.
2. **Update Table 2** - The second update modifies a record in the second table.
3. **Commit** - After both updates, the database issues a commit to indicate the transaction is complete.

However, if the system crashes after the first update but before the commit, the transaction will be incomplete and must be rolled back after recovery.

#### Steps in the Transaction Process Before the Crash:

1. The first update (on Table 1) is written to the WAL.
2. The second update (on Table 2) is written to the WAL.
3. The commit is issued and written to the WAL, signaling the completion of the transaction.

#### Post-Crash Scenario:

The system crashes before the commit is written to disk, leaving the transaction incomplete.
After the restart, the database will check the WAL.
Since there is no commit entry for the transaction, the database knows that the transaction was not fully completed.

The first update (to Table 1) is replayed from the WAL, but the second update (to Table 2) is not applied, as it was part of the incomplete transaction.

#### Detailed Representation:

```pgsql
+-------------------+
| Begin Transaction |
+-------------------+
        |
        v
+-------------------+
| Update Table 1    |
+-------------------+
        |
        v
+-------------------+
| Append Update 1 to WAL |
+-------------------+
        |
        v
+-------------------+
| Update Table 2    |
+-------------------+
        |
        v
+-------------------+
| Append Update 2 to WAL |
+-------------------+
        |
        v
+-------------------+
| Commit (Not written to WAL) |
+-------------------+
        |
        v
+-------------------+
| DB crash or power failure occurs |
+-------------------+
        |
        v
+-------------------+
| Replay WAL       |
+-------------------+
        |
        v
+-------------------+
| Apply Update 1 (from WAL) |
+-------------------+
        |
        v
+-------------------+
| Transaction Incomplete: No commit found |
+-------------------+
        |
        v
+-------------------+
| Data Restored (Only Update 1 applied) |
+-------------------+
```



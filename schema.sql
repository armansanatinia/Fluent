-- Fluent sync store. One table holds every synced record as JSON.
-- `seq` increases with every write, so a device asks for "everything after N".
CREATE TABLE IF NOT EXISTS records (
  store   TEXT    NOT NULL,
  id      TEXT    NOT NULL,
  data    TEXT    NOT NULL,
  updated INTEGER NOT NULL,           -- the device's edit time (ms); newest wins
  deleted INTEGER NOT NULL DEFAULT 0,
  seq     INTEGER NOT NULL,
  PRIMARY KEY (store, id)
);
CREATE INDEX IF NOT EXISTS records_seq ON records (seq);

CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v INTEGER NOT NULL);
INSERT OR IGNORE INTO meta (k, v) VALUES ('seq', 0);

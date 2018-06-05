"use strict";

const base = require("../base.js");
const assert = require("chai").assert;

describe("TypeCast", () => {
  const changeCaseCast = (column, next) => {
    if (column.type == "VAR_STRING") {
      const val = column.string();
      if (column.name.startsWith("upp")) return val.toUpperCase();
      if (column.name.startsWith("low")) return val.toLowerCase();
      return val;
    }
    return next();
  };

  it("query level typecast function", function(done) {
    shareConn.query(
      {
        sql: "SELECT 'blaBLA' as upper, 'blaBLA' as lower, 'blaBLA' as std, 1 as r",
        typeCast: changeCaseCast
      },
      (err, rows) => {
        assert.deepEqual(rows, [{ upper: "BLABLA", lower: "blabla", std: "blaBLA", r: 1 }]);
        done();
      }
    );
  });

  it("connection level typecast function", function(done) {
    const conn = base.createConnection({ typeCast: changeCaseCast });
    conn.connect().then(() => {
      conn.query(
        "SELECT 'blaBLA' as upper, 'blaBLA' as lower, 'blaBLA' as std, 1 as r",
        (err, rows) => {
          assert.deepEqual(rows, [{ upper: "BLABLA", lower: "blabla", std: "blaBLA", r: 1 }]);
          conn.end();
          done();
        }
      );
    });
  });

  it("compatibility automatic cast", function(done) {
    const conn = base.createConnection({ typeCast: true });
    conn.connect().then(() => {
      conn.query("SELECT 1 as r", (err, rows) => {
        assert.deepEqual(rows, [{ r: 1 }]);
        conn.end();
        done();
      });
    });
  });

  it("connection level typecast function", function(done) {
    const conn = base.createConnection({ typeCast: changeCaseCast });
    conn.connect().then(() => {
      conn.query(
        "SELECT 'blaBLA' as upper, 'blaBLA' as lower, 'blaBLA' as std, 1 as r",
        (err, rows) => {
          assert.deepEqual(rows, [{ upper: "BLABLA", lower: "blabla", std: "blaBLA", r: 1 }]);
          conn.end();
          done();
        }
      );
    });
  });

  it("cast fields", function(done) {
    const checkCaseType = (field, next) => {
      assert.equal(field.type, "VAR_STRING");
      assert.equal(field.length, 24);
      return next();
    };
    shareConn.query(
      {
        sql: "SELECT 'blaBLA' as upper",
        typeCast: checkCaseType
      },
      (err, rows) => {
        assert.deepEqual(rows, [{ upper: "blaBLA" }]);
        done();
      }
    );
  });

  it("TINY(1) to boolean cast", function(done) {
    const tinyToBoolean = (column, next) => {
      if (column.type == "TINY" && column.length === 1) {
        const val = column.int();
        return val === null ? null : val === 1;
      }
      return next();
    };
    const conn = base.createConnection({ typeCast: tinyToBoolean });
    conn.connect().then(() => {
      conn.query("CREATE TEMPORARY TABLE tinyToBool(b1 TINYINT(1), b2 TINYINT(2))");
      conn.query("INSERT INTO tinyToBool VALUES (0,0), (1,1), (2,2), (null,null)");
      conn.query("SELECT * from tinyToBool", (err, rows) => {
        assert.deepEqual(rows, [
          { b1: false, b2: 0 },
          { b1: true, b2: 1 },
          { b1: false, b2: 2 },
          { b1: null, b2: null }
        ]);
        conn.end();
        done();
      });
    });
  });
});

const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'dumsel_merchants',
  password: '9089089',
  port: 5432
});

(async () => {
  try {
    const schema = await pool.query("SELECT column_name, column_default FROM information_schema.columns WHERE table_name='products' ORDER BY ordinal_position");
    console.log('COLUMNS:', schema.rows);
    const seq = await pool.query("SELECT pg_get_serial_sequence('products','id') AS seq");
    console.log('SERIAL SEQ:', seq.rows);
    const maxid = await pool.query('SELECT MAX(id) AS maxid FROM products');
    console.log('MAX ID:', maxid.rows[0]);
    if (seq.rows[0] && seq.rows[0].seq) {
      const next = await pool.query(`SELECT last_value, is_called FROM ${seq.rows[0].seq}`);
      console.log('SEQUENCE STATUS:', next.rows[0]);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
})();

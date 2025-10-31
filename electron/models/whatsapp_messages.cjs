// Auto-generated model for table: whatsapp_messages
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`INSERT INTO whatsapp_messages (
          id, member_id, member_name, member_phone, message_type, message_content,
          status, scheduled_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s2 = db.prepare(`SELECT * FROM whatsapp_messages 
        WHERE status = 'pending' OR (status = 'scheduled' AND scheduled_at <= datetime('now'))
        ORDER BY created_at ASC`);
stmts.s3 = db.prepare(`UPDATE whatsapp_messages SET
          status = ?, sent_at = ?, error_message = ?, retry_count = retry_count + 1
        WHERE id = ?`);
stmts.s4 = db.prepare(`SELECT * FROM whatsapp_messages 
        ORDER BY created_at DESC`);
stmts.s5 = db.prepare(`UPDATE whatsapp_messages SET
          status = 'pending', retry_count = retry_count + 1
        WHERE id = ?`);
stmts.s6 = db.prepare(`SELECT * FROM whatsapp_messages 
        ORDER BY created_at DESC`);
stmts.s7 = db.prepare(`INSERT INTO whatsapp_messages (
          id, member_id, member_name, member_phone, message_type, message_content,
          status, scheduled_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

module.exports = stmts;

// Auto-generated model for table: whatsapp_templates
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`SELECT COUNT(*) as count FROM whatsapp_templates`);
stmts.s2 = db.prepare(`INSERT INTO whatsapp_templates (id, template_name, message_type, template_content, created_at)
        VALUES (?, ?, ?, ?, ?)`);
stmts.s3 = db.prepare(`UPDATE whatsapp_templates SET
          template_content = ?, updated_at = ?
        WHERE message_type = ?`);

module.exports = stmts;
